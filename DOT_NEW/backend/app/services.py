from datetime import datetime, timezone
from hashlib import sha256
from math import acos, cos, radians, sin
from random import SystemRandom
from uuid import uuid4
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import *
from .config import settings
from .adapters import sms_provider

def audit(db, actor, action, entity, before, after, correlation):
    db.add(Audit(actor_id=actor.id if actor else None, action=action, entity_id=entity, before=before, after=after, correlation_id=correlation))

def event(db, kind, centre_id=None, farmer_id=None, payload=None, correlation=None, causation=None, simulation_id=None):
    item = Event(type=kind, centre_id=centre_id, farmer_id=farmer_id, payload=payload or {}, correlation_id=correlation or str(uuid4()), causation_id=causation, simulation_id=simulation_id)
    db.add(item); db.flush(); return item

def distance(a_lat, a_lon, b_lat, b_lon):
    return 6371 * acos(min(1, cos(radians(a_lat))*cos(radians(b_lat))*cos(radians(b_lon)-radians(a_lon))+sin(radians(a_lat))*sin(radians(b_lat))))

def resources(db, centre_id, kind): return db.scalars(select(Resource).where(Resource.centre_id==centre_id, Resource.kind==kind)).all()

def centre_metrics(db: Session, centre: Centre):
    bridges, quality = resources(db, centre.id, 'WEIGHBRIDGE'), resources(db, centre.id, 'QUALITY_COUNTER')
    active_bridge = [x for x in bridges if x.status == 'ACTIVE']; active_quality = [x for x in quality if x.status == 'ACTIVE']
    bridge_capacity = sum(x.rate for x in active_bridge) or 0
    quality_capacity = sum(x.rate for x in active_quality) or 0
    staff_factor = centre.staff_active / centre.staff_planned
    bottleneck = min(bridge_capacity, quality_capacity, centre.base_capacity * staff_factor) if bridges and quality else centre.base_capacity * staff_factor
    effective = max(0, bottleneck * centre.efficiency) if centre.status == 'OPEN' else 0
    queue = db.scalar(select(func.count()).select_from(Booking).where(Booking.centre_id==centre.id, Booking.status.in_(ACTIVE))) or 0
    expected = db.scalar(select(func.coalesce(func.sum(Booking.quantity), 0)).where(Booking.centre_id==centre.id, Booking.status.in_(ACTIVE))) or 0
    booked_next_hour = db.scalar(select(func.count()).select_from(Booking).join(Slot, Slot.id==Booking.slot_id).where(Booking.centre_id==centre.id, Booking.status.in_(ACTIVE), Slot.start <= now()+3600, Slot.end >= now())) or 0
    predicted_arrivals = booked_next_hour + 3
    wait = round((queue + predicted_arrivals*.5) / max(effective, .25) * 60)
    utilization = min(1, (queue + predicted_arrivals) / max(effective, 1))
    congestion = 'CRITICAL' if wait >= 90 or utilization >= 1 else 'HIGH' if wait >= 55 or utilization >= .75 else 'MODERATE' if wait >= 30 or utilization >= .45 else 'LOW'
    return {'effective_capacity': round(effective, 1), 'base_capacity': centre.base_capacity, 'bridge_capacity': bridge_capacity, 'quality_capacity': quality_capacity, 'staff_factor': round(staff_factor,2), 'queue':queue, 'predicted_arrivals':predicted_arrivals, 'wait_minutes':wait, 'utilization':round(utilization,2), 'congestion':congestion, 'health':'OFFLINE' if centre.status!='OPEN' else ('CRITICAL' if congestion=='CRITICAL' else 'CONGESTED' if congestion=='HIGH' else 'MODERATE' if congestion=='MODERATE' else 'NORMAL')}

def available_slot(db, centre, quantity, after=0):
    for slot in db.scalars(select(Slot).where(Slot.centre_id==centre.id, Slot.start > max(now(), after)).order_by(Slot.start)).all():
        bookings = db.scalars(select(Booking).where(Booking.slot_id==slot.id, Booking.status.in_(ACTIVE))).all()
        if len(bookings) < slot.capacity and sum(b.quantity for b in bookings)+quantity <= slot.quantity_capacity*(1-settings.capacity_buffer): return slot
    return None

def recommend(db, farmer, crop_code, quantity, lat=None, lon=None, exclude=None):
    crop = db.scalar(select(Crop).where(Crop.code==crop_code))
    if not crop or crop_code not in farmer.crops: raise ValueError('This crop is not eligible for this farmer.')
    candidates=[]
    for centre in db.scalars(select(Centre).where(Centre.status=='OPEN')).all():
        if centre.id==exclude or crop_code not in centre.crops: continue
        slot = available_slot(db, centre, quantity)
        if not slot: continue
        metrics=centre_metrics(db, centre); km=distance(lat or farmer.lat, lon or farmer.lon, centre.lat, centre.lon); travel=round(km/32*60)
        completion=max(0.05, min(.98, 1 - metrics['utilization']*.55 - metrics['wait_minutes']/500))
        score=round(metrics['wait_minutes']*1.6 + travel*.55 + metrics['utilization']*40 + (1-completion)*30)
        candidates.append({'centre_id':centre.id,'centre_code':centre.code,'centre_name':centre.name,'slot_id':slot.id,'start':slot.start,'end':slot.end,'distance_km':round(km,1),'travel_minutes':travel,'wait_minutes':metrics['wait_minutes'],'capacity':metrics['effective_capacity'],'congestion':metrics['congestion'],'completion_probability':round(completion,2),'score':score,'metrics':metrics})
    if not candidates: return [], None
    # CP-SAT use is optional at runtime but gives exact minimum feasible candidate when installed.
    try:
        from ortools.sat.python import cp_model
        model=cp_model.CpModel(); choices=[model.NewBoolVar(f'c{i}') for i in range(len(candidates))]; model.AddExactlyOne(choices); model.Minimize(sum(choices[i]*c['score'] for i,c in enumerate(candidates))); solver=cp_model.CpSolver(); solver.Solve(model); selected=next(c for i,c in enumerate(candidates) if solver.Value(choices[i]))
    except Exception: selected=min(candidates, key=lambda c:c['score'])
    candidates.sort(key=lambda c:c['score']); return candidates[:5], selected

def run_optimization(db, farmer, crop, quantity, **kwargs):
    candidates, selected = recommend(db, farmer, crop, quantity, **kwargs)
    run=Optimization(farmer_id=farmer.id,candidates=candidates,selected=selected['centre_id'] if selected else None,constraints=['centre open','crop accepted','farmer eligible','slot quantity capacity','operating window','effective-capacity safety buffer'])
    db.add(run); db.flush(); return run, candidates, selected

def message(db, farmer, kind, body):
    notification=Notification(farmer_id=farmer.id,type=kind,body=body); db.add(notification); db.flush()
    try: notification.provider_id=sms_provider.send(farmer.phone, body); notification.status='SENT'; notification.attempts=1
    except Exception as exc: notification.status='RETRYING'; notification.last_error=str(exc); notification.attempts=1; notification.next_attempt=now()+60
    return notification

def create_proposals(db, centre_id, trigger):
    centre=db.get(Centre,centre_id); old=centre_metrics(db,centre); created=[]
    bookings=db.scalars(select(Booking).where(Booking.centre_id==centre_id, Booking.status.in_(['CONFIRMED','REBALANCE_PENDING']))).all()
    for booking in bookings:
        farmer=db.get(Farmer,booking.farmer_id)
        if booking.reassigned_at and now()-booking.reassigned_at < settings.cooldown_minutes*60: continue
        crop=db.get(Crop,booking.crop_id); run, candidates, alternative=run_optimization(db,farmer,crop.code,booking.quantity,exclude=centre_id)
        if not alternative: continue
        saved=old['wait_minutes']-alternative['wait_minutes']; extra=alternative['distance_km']-distance(farmer.lat,farmer.lon,centre.lat,centre.lon)
        if saved < settings.min_saving or extra > settings.max_extra_km: continue
        if db.scalar(select(Proposal).where(Proposal.booking_id==booking.id, Proposal.status=='PROPOSED')): continue
        code=f'{SystemRandom().randint(1000,9999)}'; evidence={'old_wait_minutes':old['wait_minutes'],'new_wait_minutes':alternative['wait_minutes'],'time_saved_minutes':saved,'extra_travel_km':round(extra,1),'alternative':alternative,'reason_codes':['LOWER_WAIT','HIGHER_CAPACITY','LOWER_CONGESTION']}
        proposal=Proposal(booking_id=booking.id,old_centre_id=centre_id,new_centre_id=alternative['centre_id'],new_slot_id=alternative['slot_id'],optimizer_id=run.id,trigger_event_id=trigger.id,evidence=evidence,code_hash=sha256(code.encode()).hexdigest(),expires_at=now()+settings.proposal_minutes*60)
        booking.status='REBALANCE_PENDING'; db.add(proposal); db.flush()
        event(db,'REBALANCE_PROPOSED',centre_id,farmer.id,{'proposal_id':proposal.id,**evidence},trigger.correlation_id,trigger.id)
        message(db,farmer,'REBALANCE_PROPOSED',f'KISH ALERT: {centre.name} is delayed ({old["wait_minutes"]} min). {alternative["centre_name"]} can process you in {alternative["wait_minutes"]} min. Extra travel {round(extra,1)} km. Save {saved} min. Reply 1 {code} to switch or 2 {code} to stay.')
        created.append(proposal)
    return created

def recalculate(db, centre_id, trigger):
    centre=db.get(Centre,centre_id); metrics=centre_metrics(db,centre)
    db.add(Snapshot(centre_id=centre_id,data=metrics)); event(db,'CAPACITY_UPDATED',centre_id,payload=metrics,correlation=trigger.correlation_id,causation=trigger.id); event(db,'WAIT_UPDATED',centre_id,payload=metrics,correlation=trigger.correlation_id,causation=trigger.id)
    return create_proposals(db,centre_id,trigger)
