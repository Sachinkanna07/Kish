from contextlib import asynccontextmanager
from io import BytesIO
from hashlib import sha256
from time import time
from uuid import uuid4
import re
from fastapi import FastAPI, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from reportlab.pdfgen import canvas
from .config import settings
from .db import Base, engine, get_db, Session as DbSession
from .models import *
from .security import *
from .services import *
from .realtime import hub
from .adapters import payment_provider

@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    from .seed import seed
    with DbSession() as db: seed(db); db.commit()
    yield

app=FastAPI(title='Kish Procurement API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=list(settings.origins),allow_credentials=True,allow_methods=['*'],allow_headers=['Content-Type','X-CSRF-Token','Idempotency-Key'])

class OTPRequest(BaseModel): identifier:str
class OTPVerify(BaseModel): identifier:str; code:str=Field(min_length=6,max_length=6)
class Login(BaseModel): login:str; password:str=Field(min_length=8,max_length=256)
class FarmerIn(BaseModel): code:str=Field(pattern=r'^FM-\d{5}$'); name:str; phone:str=Field(pattern=r'^\d{10}$'); email:EmailStr|None=None; village:str; district:str='Thanjavur'; region:str='Delta'; address:str=''; reference:str=''; notes:str=''; crops:list[str]=['paddy']; lat:float=10.79; lon:float=79.14
class RecommendationIn(BaseModel): crop:str; quantity:float=Field(gt=0,le=100); lat:float|None=None; lon:float|None=None
class BookingIn(BaseModel): crop:str; quantity:float=Field(gt=0,le=100); centre_id:str; slot_id:str; optimizer_id:str|None=None
class ResourceStatus(BaseModel): status:str=Field(pattern='^(ACTIVE|FAILED|MAINTENANCE|OFFLINE|DELAYED)$'); notes:str=''; version:int
class CheckIn(BaseModel): token:str
class WeighIn(BaseModel): booking_id:str; resource_id:str; gross:float=Field(gt=0); tare:float=Field(ge=0)
class QualityIn(BaseModel): booking_id:str; moisture:float=Field(ge=0,le=100); foreign_matter:float=Field(ge=0,le=100); damaged:float=Field(ge=0,le=100); grade:str; decision:str=Field(pattern='^(ACCEPT|ADJUST|REJECT)$'); reason:str=''
class ProcurementIn(BaseModel): booking_id:str; accepted:float=Field(ge=0); rate:float=Field(gt=0)
class Decision(BaseModel): code:str|None=None
class SMSInbound(BaseModel): message_id:str; from_phone:str=Field(pattern=r'^\d{10}$'); body:str
class SimulationIn(BaseModel): centre_id:str; scenario:str=Field(pattern='^(SURGE|WEIGHBRIDGE_FAILURE|QUALITY_FAILURE|STAFF_SHORTAGE|RESTORE)$')

def user_farmer(db,user):
    farmer=db.scalar(select(Farmer).where(Farmer.user_id==user.id))
    if not farmer: raise HTTPException(404,'Farmer profile unavailable.')
    return farmer
def centre_access(db,user,centre_id):
    if user.role=='ADMIN': return
    allowed=db.scalar(select(Assignment).where(Assignment.user_id==user.id,Assignment.centre_id==centre_id))
    if not allowed: raise HTTPException(403,'You are not assigned to this centre.')
def dto_booking(db,b):
    centre=db.get(Centre,b.centre_id); slot=db.get(Slot,b.slot_id); farmer=db.get(Farmer,b.farmer_id)
    metrics=centre_metrics(db,centre); ahead=db.scalar(select(func.count()).select_from(Booking).where(Booking.centre_id==b.centre_id,Booking.status.in_(ACTIVE),Booking.created_at<b.created_at)) or 0
    return {'id':b.id,'token':b.token,'status':b.status,'centre':{'id':centre.id,'code':centre.code,'name':centre.name},'arrival_window':{'start':slot.start,'end':slot.end},'quantity':b.quantity,'queue_position':ahead+1,'people_ahead':ahead,'predicted_wait_minutes':metrics['wait_minutes'],'created_at':b.created_at}
def event_response(event): return {'event_id':event.id,'type':event.type,'payload':event.payload,'correlation_id':event.correlation_id}
async def broadcast_event(db,event):
    farmer_channels=[f'farmer:{event.farmer_id}'] if event.farmer_id else []
    channels=[f'centre:{event.centre_id}','admin:network',*farmer_channels] if event.centre_id else ['admin:network',*farmer_channels]
    await hub.publish(channels,event_response(event))
def cookie(response,access,refresh,csrf):
    secure=settings.production; response.set_cookie('kish_session',access,httponly=True,secure=secure,samesite='lax',max_age=900,path='/'); response.set_cookie('kish_refresh',refresh,httponly=True,secure=secure,samesite='strict',max_age=1209600,path='/api/v1/auth'); response.set_cookie('kish_csrf',csrf,httponly=False,secure=secure,samesite='lax',max_age=900,path='/')

@app.get('/health')
def health(): return {'status':'ok','service':'kish-api','simulation_mode':settings.simulation}
@app.get('/ready')
def ready(db:Session=Depends(get_db)): db.execute(select(func.count()).select_from(User)); return {'status':'ready'}

@app.post('/api/v1/auth/farmer/request-otp')
def request_otp(body:OTPRequest,request:Request,db:Session=Depends(get_db)):
    check_limit(db,f'otp:{request.client.host}:{body.identifier.lower()}')
    farmer=db.scalar(select(Farmer).join(User,Farmer.user_id==User.id).where((Farmer.code==body.identifier.upper())|(Farmer.phone==body.identifier)|(Farmer.email==body.identifier.lower())))
    # Deliberately neutral response prevents account discovery.
    if not farmer or farmer.status!='ACTIVE': return {'accepted':True,'message':'If this active account exists, a code has been sent.'}
    code='123456' if not settings.production else f'{__import__("secrets").randbelow(1000000):06d}'
    issue_otp(db,db.get(User,farmer.user_id),code); message(db,farmer,'OTP',f'KISH verification code: {code}. It expires in 5 minutes. {"DEVELOPMENT ONLY" if not settings.production else ""}')
    return {'accepted':True,'message':'If this active account exists, a code has been sent.','development_code':code if not settings.production else None}
@app.post('/api/v1/auth/farmer/verify-otp')
def verify_otp(body:OTPVerify,response:Response,request:Request,db:Session=Depends(get_db)):
    check_limit(db,f'verify:{request.client.host}:{body.identifier.lower()}',maximum=8)
    farmer=db.scalar(select(Farmer).where((Farmer.code==body.identifier.upper())|(Farmer.phone==body.identifier)|(Farmer.email==body.identifier.lower()),Farmer.status=='ACTIVE'))
    if not farmer: raise HTTPException(401,'Invalid or expired verification code.')
    user=db.get(User,farmer.user_id); consume_otp(db,user,body.code); access,refresh,csrf=create_session(db,user); cookie(response,access,refresh,csrf); return {'user':{'name':user.name,'role':user.role},'csrf_token':csrf}
@app.post('/api/v1/auth/{kind}/login')
def staff_login(kind:str,body:Login,response:Response,request:Request,db:Session=Depends(get_db)):
    expected='AUTHORITY' if kind=='authority' else 'ADMIN' if kind=='admin' else None
    if not expected: raise HTTPException(404)
    check_limit(db,f'login:{request.client.host}:{body.login.lower()}',maximum=10)
    user=db.scalar(select(User).where(User.login==body.login.lower(),User.role==expected,User.active==True))
    if not user or not verify_password(body.password,user.password): raise HTTPException(401,'Invalid credentials.')
    access,refresh,csrf=create_session(db,user); cookie(response,access,refresh,csrf); return {'user':{'name':user.name,'role':user.role},'csrf_token':csrf}
@app.post('/api/v1/auth/refresh')
def refresh(response:Response,request:Request,db:Session=Depends(get_db)):
    token=request.cookies.get('kish_refresh'); session=db.scalar(select(AuthSession).where(AuthSession.refresh_hash==sha(token or ''),AuthSession.refresh_expires_at>now()))
    if not session: raise HTTPException(401,'Session expired.')
    db.delete(session); user=db.get(User,session.user_id); access,refresh_token,csrf=create_session(db,user); cookie(response,access,refresh_token,csrf); return {'csrf_token':csrf}
@app.post('/api/v1/auth/logout')
def logout(response:Response,request:Request,db:Session=Depends(get_db)):
    _,session=session_from_request(request,db); db.delete(session); response.delete_cookie('kish_session');response.delete_cookie('kish_refresh');response.delete_cookie('kish_csrf');return {'ok':True}

@app.get('/api/v1/farmer/me')
def me(user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    f=user_farmer(db,user); return {'id':f.id,'farmer_id':f.code,'name':user.name,'phone':f.phone,'village':f.village,'district':f.district,'crops':f.crops}
@app.get('/api/v1/farmer/dashboard')
def farmer_dashboard(user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    f=user_farmer(db,user); b=db.scalar(select(Booking).where(Booking.farmer_id==f.id,Booking.status.in_(ACTIVE)).order_by(Booking.created_at.desc())); proposal=db.scalar(select(Proposal).join(Booking).where(Booking.farmer_id==f.id,Proposal.status=='PROPOSED',Proposal.expires_at>now()))
    return {'farmer':{'name':user.name,'farmer_id':f.code,'village':f.village},'booking':dto_booking(db,b) if b else None,'rebalance':proposal_dto(db,proposal) if proposal else None,'notifications':[{'id':n.id,'type':n.type,'body':n.body,'status':n.status,'at':n.created_at} for n in db.scalars(select(Notification).where(Notification.farmer_id==f.id).order_by(Notification.created_at.desc()).limit(20))]}
@app.post('/api/v1/farmer/centres/recommendations')
def recommendations(body:RecommendationIn,user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    f=user_farmer(db,user)
    try: run,candidates,chosen=run_optimization(db,f,body.crop,body.quantity,lat=body.lat,lon=body.lon)
    except ValueError as e: raise HTTPException(422,str(e))
    if not chosen: raise HTTPException(409,'No eligible centre has a safe slot at this time.')
    nearest=min(candidates,key=lambda c:c['distance_km']); chosen['why']=[f"{max(0, nearest['wait_minutes']-chosen['wait_minutes'])} minutes less expected waiting than the nearest viable centre",f"{chosen['capacity']} farmers/hour effective capacity",f"{int(chosen['completion_probability']*100)}% same-day completion probability"]
    chosen['tradeoff']=f"{max(0,chosen['distance_km']-nearest['distance_km']):.1f} km more travel than the nearest viable centre"
    return {'optimizer_run_id':run.id,'recommended':chosen,'candidates':candidates,'model_version':'deterministic-v1','explanation_source':'optimizer score components and capacity snapshots'}
@app.post('/api/v1/farmer/bookings')
async def booking(body:BookingIn,request:Request,user:User=Depends(require('FARMER')),idempotency_key:str=Header(...,alias='Idempotency-Key'),db:Session=Depends(get_db)):
    f=user_farmer(db,user); fingerprint=sha256(body.model_dump_json().encode()).hexdigest(); prior=db.scalar(select(Idempotency).where(Idempotency.key==idempotency_key))
    if prior:
        if prior.fingerprint!=fingerprint: raise HTTPException(409,'Idempotency key reused with different data.')
        return prior.result
    if db.scalar(select(Booking).where(Booking.farmer_id==f.id,Booking.status.in_(ACTIVE))): raise HTTPException(409,'You already have an active booking.')
    centre=db.get(Centre,body.centre_id); slot=db.get(Slot,body.slot_id); crop=db.scalar(select(Crop).where(Crop.code==body.crop))
    if not centre or not slot or slot.centre_id!=centre.id or not crop or body.crop not in f.crops or body.crop not in centre.crops: raise HTTPException(422,'The selected centre or slot is no longer eligible.')
    # Transactional slot capacity check; PostgreSQL locks the slot row. SQLite is used only for local demo.
    if not settings.database_url.startswith('sqlite'): db.execute(select(Slot).where(Slot.id==slot.id).with_for_update())
    occupants=db.scalars(select(Booking).where(Booking.slot_id==slot.id,Booking.status.in_(ACTIVE))).all()
    if len(occupants)>=slot.capacity or sum(x.quantity for x in occupants)+body.quantity>slot.quantity_capacity: raise HTTPException(409,'This arrival window just filled. Refresh recommendations.')
    token=f'{centre.code}-{(db.scalar(select(func.count()).select_from(Booking).where(Booking.centre_id==centre.id))+1001):04d}'
    b=Booking(farmer_id=f.id,centre_id=centre.id,crop_id=crop.id,slot_id=slot.id,quantity=body.quantity,token=token,optimizer_id=body.optimizer_id); db.add(b);db.flush(); ev=event(db,'BOOKING_CONFIRMED',centre.id,f.id,{'booking_id':b.id,'token':token});audit(db,user,'BOOKING_CREATED',b.id,{},dto_booking(db,b),ev.correlation_id);message(db,f,'TOKEN_CONFIRMATION',f'KISH booking confirmed. Token {token}; {centre.name}; arrive {datetime.fromtimestamp(slot.start).strftime("%H:%M")}-{datetime.fromtimestamp(slot.end).strftime("%H:%M")}');result={'booking':dto_booking(db,b),'event':event_response(ev)};db.add(Idempotency(key=idempotency_key,fingerprint=fingerprint,result=result));await broadcast_event(db,ev);return result
@app.get('/api/v1/farmer/token')
def token(user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    f=user_farmer(db,user); b=db.scalar(select(Booking).where(Booking.farmer_id==f.id,Booking.status.in_(ACTIVE)).order_by(Booking.created_at.desc())); return dto_booking(db,b) if b else {'booking':None}
@app.get('/api/v1/farmer/queue')
def queue(user:User=Depends(require('FARMER')),db:Session=Depends(get_db)): return token(user,db)
def proposal_dto(db,p):
    if not p:return None
    old,new=db.get(Centre,p.old_centre_id),db.get(Centre,p.new_centre_id);return {'id':p.id,'status':p.status,'expires_at':p.expires_at,'current_centre':old.name,'alternative_centre':new.name,**p.evidence}
@app.get('/api/v1/farmer/rebalance')
def rebalance(user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    f=user_farmer(db,user);p=db.scalar(select(Proposal).join(Booking).where(Booking.farmer_id==f.id,Proposal.status=='PROPOSED',Proposal.expires_at>now()));return proposal_dto(db,p)
@app.post('/api/v1/farmer/rebalance/{proposal_id}/{action}')
async def decide(proposal_id:str,action:str,body:Decision,user:User=Depends(require('FARMER')),db:Session=Depends(get_db)):
    if action not in ('accept','decline'):raise HTTPException(404)
    f=user_farmer(db,user); return await decision(db,proposal_id,action,body.code,f,user,'WEB')

@app.get('/api/v1/authority/dashboard')
def authority_dashboard(user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    centres=[db.get(Centre,a.centre_id) for a in db.scalars(select(Assignment).where(Assignment.user_id==user.id))];return {'centres':[{'id':c.id,'code':c.code,'name':c.name,**centre_metrics(db,c)} for c in centres]}
@app.get('/api/v1/authority/farmers')
def farmers(q:str='',user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    items=db.scalars(select(Farmer).join(User).where((Farmer.code.contains(q))|(Farmer.phone.contains(q))|(User.name.contains(q))).limit(100)).all();return [{'id':f.id,'farmer_id':f.code,'name':db.get(User,f.user_id).name,'phone':f.phone,'status':f.status,'village':f.village,'crops':f.crops} for f in items]
@app.post('/api/v1/authority/farmers')
def register_farmer(body:FarmerIn,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    if db.scalar(select(Farmer).where((Farmer.code==body.code)|(Farmer.phone==body.phone)|((Farmer.email==body.email) if body.email else False))): raise HTTPException(409,'Farmer ID, phone, or email is already registered.')
    account=User(login=body.phone,name=body.name,role='FARMER');db.add(account);db.flush();f=Farmer(user_id=account.id,registered_by=user.id,verified_at=now(),status='ACTIVE',**body.model_dump());db.add(f);db.flush();ev=event(db,'FARMER_REGISTERED',farmer_id=f.id,payload={'farmer_id':f.code});audit(db,user,'FARMER_REGISTERED',f.id,{}, {'farmer_id':f.code},ev.correlation_id);message(db,f,'REGISTRATION',f'KISH registration complete. Your Farmer ID is {f.code}. Use it to receive your verification code.');return {'id':f.id,'farmer_id':f.code,'status':f.status}
@app.get('/api/v1/authority/queue')
def authority_queue(centre_id:str,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    centre_access(db,user,centre_id);items=db.scalars(select(Booking).where(Booking.centre_id==centre_id,Booking.status.in_(ACTIVE)).order_by(Booking.created_at)).all();return [dto_booking(db,b) for b in items]
@app.post('/api/v1/authority/tokens/check-in')
async def check_in(body:CheckIn,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    b=db.scalar(select(Booking).where(Booking.token==body.token));
    if not b:raise HTTPException(404,'Token not found.')
    centre_access(db,user,b.centre_id)
    if b.status!='CONFIRMED':raise HTTPException(409,'This token cannot be checked in at its current status.')
    b.status='CHECKED_IN';b.checked_in_at=now();b.verified_by=user.id;b.verified_at=now();ev=event(db,'FARMER_CHECKED_IN',b.centre_id,b.farmer_id,{'booking_id':b.id,'token':b.token});audit(db,user,'TOKEN_CHECKED_IN',b.id,{'status':'CONFIRMED'},{'status':'CHECKED_IN'},ev.correlation_id);await broadcast_event(db,ev);return dto_booking(db,b)
@app.get('/api/v1/authority/operations')
def operations(centre_id:str,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    centre_access(db,user,centre_id);c=db.get(Centre,centre_id);return {'centre':{'id':c.id,'name':c.name,**centre_metrics(db,c)},'resources':[{'id':r.id,'code':r.code,'kind':r.kind,'status':r.status,'rate':r.rate,'notes':r.notes,'version':r.version} for r in db.scalars(select(Resource).where(Resource.centre_id==centre_id))]}
@app.patch('/api/v1/authority/resources/{resource_id}')
async def resource_update(resource_id:str,body:ResourceStatus,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    r=db.get(Resource,resource_id)
    if not r:raise HTTPException(404)
    centre_access(db,user,r.centre_id)
    if r.version!=body.version:raise HTTPException(409,'This equipment changed elsewhere. Refresh before retrying.')
    before={'status':r.status,'version':r.version};r.status=body.status;r.notes=body.notes;r.version+=1;r.updated_at=now();ev=event(db,'WEIGHBRIDGE_STATUS_CHANGED' if r.kind=='WEIGHBRIDGE' else 'QUALITY_COUNTER_STATUS_CHANGED',r.centre_id,payload={'resource':r.code,'before':before['status'],'after':r.status});audit(db,user,ev.type,r.id,before,{'status':r.status,'version':r.version},ev.correlation_id);proposals=recalculate(db,r.centre_id,ev);await broadcast_event(db,ev);return {'resource':{'id':r.id,'status':r.status,'version':r.version},'proposals_created':len(proposals),'metrics':centre_metrics(db,db.get(Centre,r.centre_id))}
@app.post('/api/v1/authority/weighments')
async def weigh(body:WeighIn,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    b=db.get(Booking,body.booking_id);r=db.get(Resource,body.resource_id)
    if not b or not r:raise HTTPException(404)
    centre_access(db,user,b.centre_id)
    if r.centre_id!=b.centre_id or r.kind!='WEIGHBRIDGE' or r.status!='ACTIVE':raise HTTPException(422,'Select an active weighbridge at this centre.')
    if b.status!='CHECKED_IN':raise HTTPException(409,'Booking must be checked in before weighment.')
    if body.gross<=body.tare:raise HTTPException(422,'Gross weight must exceed tare weight.')
    b.status='WEIGHING';w=Weighment(booking_id=b.id,resource_id=r.id,operator_id=user.id,gross=body.gross,tare=body.tare,net=body.gross-body.tare);db.add(w);ev=event(db,'WEIGHMENT_COMPLETED',b.centre_id,b.farmer_id,{'booking_id':b.id,'net':w.net});audit(db,user,'WEIGHMENT_COMPLETED',b.id,{}, {'net':w.net},ev.correlation_id);await broadcast_event(db,ev);return {'id':w.id,'net':w.net}
@app.post('/api/v1/authority/quality-checks')
async def quality(body:QualityIn,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    b=db.get(Booking,body.booking_id)
    if not b:raise HTTPException(404)
    centre_access(db,user,b.centre_id)
    if b.status!='WEIGHING':raise HTTPException(409,'Booking must be weighed before quality review.')
    if body.decision in ('ADJUST','REJECT') and not body.reason.strip():raise HTTPException(422,'A reason is required for adjusted or rejected quality.')
    b.status='QUALITY';q=Quality(operator_id=user.id,**body.model_dump());db.add(q);ev=event(db,'QUALITY_COMPLETED',b.centre_id,b.farmer_id,{'booking_id':b.id,'decision':q.decision,'grade':q.grade});audit(db,user,'QUALITY_COMPLETED',b.id,{},ev.payload,ev.correlation_id);await broadcast_event(db,ev);return {'id':q.id,'decision':q.decision}
@app.post('/api/v1/authority/procurements')
async def procurement(body:ProcurementIn,user:User=Depends(require('AUTHORITY')),db:Session=Depends(get_db)):
    b=db.get(Booking,body.booking_id)
    if not b:raise HTTPException(404)
    centre_access(db,user,b.centre_id)
    if b.status!='QUALITY':raise HTTPException(409,'Booking must complete quality review before procurement.')
    w=db.scalar(select(Weighment).where(Weighment.booking_id==b.id));q=db.scalar(select(Quality).where(Quality.booking_id==b.id))
    if not w or not q:raise HTTPException(409,'Weighment and quality records are required.')
    if body.accepted>w.net:raise HTTPException(422,'Accepted quantity cannot exceed measured net weight.')
    amount=round(body.accepted*body.rate,2);snapshot={'measured_quantity':w.net,'accepted_quantity':body.accepted,'quality_grade':q.grade,'rate':body.rate,'amount':amount};p=Procurement(booking_id=b.id,operator_id=user.id,accepted=body.accepted,rate=body.rate,amount=amount,snapshot=snapshot);db.add(p);db.flush();payment=Payment(procurement_id=p.id,amount=amount,status='PENDING',reference=f'KISH-PAY-{p.id[:8].upper()}',simulated=True);db.add(payment);b.status='PROCUREMENT_COMPLETE';b.completed_at=now();ev=event(db,'PROCUREMENT_COMPLETED',b.centre_id,b.farmer_id,{'booking_id':b.id,'amount':amount});audit(db,user,'PROCUREMENT_COMPLETED',b.id,{},snapshot,ev.correlation_id);message(db,db.get(Farmer,b.farmer_id),'PROCUREMENT_COMPLETE',f'KISH procurement complete. Amount ₹{amount:,.2f}. Payment is pending in simulated development mode.');await broadcast_event(db,ev);return {'procurement_id':p.id,'payment':{'id':payment.id,'status':payment.status,'simulated':True},'receipt_url':f'/api/v1/receipts/{p.id}.pdf'}

@app.get('/api/v1/admin/dashboard')
def admin_dashboard(user:User=Depends(require('ADMIN')),db:Session=Depends(get_db)):
    centres=db.scalars(select(Centre)).all(); metrics=[centre_metrics(db,c) for c in centres];waiting=sum(m['queue'] for m in metrics);completed=db.scalar(select(func.count()).select_from(Booking).where(Booking.status=='PROCUREMENT_COMPLETE')) or 0;return {'kpis':{'active_centres':sum(c.status=='OPEN' for c in centres),'currently_waiting':waiting,'average_wait':round(sum(m['wait_minutes'] for m in metrics)/max(1,len(metrics))),'critical_centres':sum(m['health'] in ('CRITICAL','OFFLINE') for m in metrics),'procurements_completed':completed,'active_rebalance_proposals':db.scalar(select(func.count()).select_from(Proposal).where(Proposal.status=='PROPOSED')) or 0},'centres':[{'id':c.id,'code':c.code,'name':c.name,'lat':c.lat,'lon':c.lon,**m} for c,m in zip(centres,metrics)]}
@app.get('/api/v1/admin/rebalancing')
def admin_rebalancing(user:User=Depends(require('ADMIN')),db:Session=Depends(get_db)):return [proposal_dto(db,p) for p in db.scalars(select(Proposal).order_by(Proposal.created_at.desc()).limit(100))]
@app.get('/api/v1/admin/audit')
def admin_audit(user:User=Depends(require('ADMIN')),db:Session=Depends(get_db)):return [{'id':a.id,'action':a.action,'entity_id':a.entity_id,'before':a.before,'after':a.after,'at':a.created_at} for a in db.scalars(select(Audit).order_by(Audit.created_at.desc()).limit(200))]
@app.post('/api/v1/admin/simulation')
async def simulate(body:SimulationIn,user:User=Depends(require('ADMIN')),db:Session=Depends(get_db)):
    c=db.get(Centre,body.centre_id)
    if not c:raise HTTPException(404)
    run=Simulation(scenario=body.scenario,centre_id=c.id,actor_id=user.id);db.add(run);db.flush(); target=None
    if body.scenario=='WEIGHBRIDGE_FAILURE':target=db.scalar(select(Resource).where(Resource.centre_id==c.id,Resource.kind=='WEIGHBRIDGE',Resource.status=='ACTIVE')); target.status='FAILED' if target else 'FAILED'
    elif body.scenario=='QUALITY_FAILURE':target=db.scalar(select(Resource).where(Resource.centre_id==c.id,Resource.kind=='QUALITY_COUNTER',Resource.status=='ACTIVE')); target.status='FAILED' if target else 'FAILED'
    elif body.scenario=='STAFF_SHORTAGE':c.staff_active=max(1,c.staff_active-3)
    elif body.scenario=='RESTORE':
        for r in db.scalars(select(Resource).where(Resource.centre_id==c.id)):r.status='ACTIVE'
        c.staff_active=c.staff_planned
    elif body.scenario=='SURGE':
        # A durable event feeds the normal metrics path; no chart-only mutation.
        pass
    ev=event(db,'SIMULATION_EVENT',c.id,payload={'scenario':body.scenario,'resource':target.code if target else None},simulation_id=run.id); proposals=recalculate(db,c.id,ev);run.result={'event_id':ev.id,'proposals_created':len(proposals),'metrics':centre_metrics(db,c)};audit(db,user,'SIMULATION_RUN',run.id,{},run.result,ev.correlation_id);await broadcast_event(db,ev);return run.result
@app.get('/api/v1/admin/reports/{report}.csv')
def report(report:str,user:User=Depends(require('ADMIN')),db:Session=Depends(get_db)):
    if report not in ('procurement','capacity','payments'):raise HTTPException(404)
    rows=['report,centre,value,status']
    for c in db.scalars(select(Centre)):
        if report=='capacity':m=centre_metrics(db,c);rows.append(f'capacity,{c.code},{m["effective_capacity"]},{m["congestion"]}')
        elif report=='procurement':v=db.scalar(select(func.coalesce(func.sum(Procurement.amount),0)).join(Booking).where(Booking.centre_id==c.id));rows.append(f'procurement,{c.code},{v},completed')
        else:v=db.scalar(select(func.count()).select_from(Payment).join(Procurement).join(Booking).where(Booking.centre_id==c.id));rows.append(f'payments,{c.code},{v},tracked')
    return Response('\n'.join(rows),media_type='text/csv',headers={'Content-Disposition':f'attachment; filename="{report}.csv"'})

@app.get('/api/v1/receipts/{procurement_id}.pdf')
def receipt(procurement_id:str,request:Request,db:Session=Depends(get_db)):
    user=current_user(request,db);p=db.get(Procurement,procurement_id)
    if not p:raise HTTPException(404)
    b=db.get(Booking,p.booking_id);f=db.get(Farmer,b.farmer_id)
    if user.role=='FARMER' and f.user_id!=user.id:raise HTTPException(403)
    if user.role=='AUTHORITY':centre_access(db,user,b.centre_id)
    buf=BytesIO();pdf=canvas.Canvas(buf);pdf.setTitle(f'Kish receipt {p.id}');pdf.setFont('Helvetica-Bold',18);pdf.drawString(72,760,'KISH Digital Procurement Receipt');pdf.setFont('Helvetica',11);lines=[f'Receipt ID: {p.id}',f'Farmer: {db.get(User,f.user_id).name} ({f.code})',f'Centre: {db.get(Centre,b.centre_id).name}',f'Crop: {db.get(Crop,b.crop_id).name}',f'Expected quantity: {b.quantity:.2f} tonnes',f'Measured quantity: {p.snapshot["measured_quantity"]:.2f} tonnes',f'Accepted quantity: {p.accepted:.2f} tonnes',f'Quality grade: {p.snapshot["quality_grade"]}',f'Rate: INR {p.rate:,.2f}/tonne',f'Amount: INR {p.amount:,.2f}',f'Verification reference: KISH-R-{p.id[:12].upper()}']
    for i,line in enumerate(lines):pdf.drawString(72,720-i*28,line)
    pdf.drawString(72,380,'This receipt is immutable. Verify using its receipt reference.');pdf.showPage();pdf.save();buf.seek(0);return StreamingResponse(buf,media_type='application/pdf',headers={'Content-Disposition':f'attachment; filename="kish-receipt-{p.id}.pdf"'})

async def decision(db,proposal_id,action,code,farmer,actor,channel):
    p=db.get(Proposal,proposal_id)
    if not p or p.status!='PROPOSED' or p.expires_at<=now():raise HTTPException(409,'This proposal is no longer valid. Your existing booking is safe.')
    b=db.get(Booking,p.booking_id)
    if b.farmer_id!=farmer.id or b.status not in ('CONFIRMED','REBALANCE_PENDING'):raise HTTPException(403,'This proposal is unavailable.')
    if code and sha256(code.encode()).hexdigest()!=p.code_hash:raise HTTPException(401,'Invalid proposal code.')
    if action=='decline':p.status='DECLINED';p.decided_at=now();p.channel=channel;b.status='CONFIRMED';ev=event(db,'REBALANCE_DECLINED',b.centre_id,b.farmer_id,{'proposal_id':p.id});audit(db,actor,'REBALANCE_DECLINED',p.id,{}, {'status':p.status},ev.correlation_id);await broadcast_event(db,ev);return {'status':p.status}
    # Atomic locked reallocation. Check target is still safe, then change one booking only.
    slot=db.get(Slot,p.new_slot_id);target=db.get(Centre,p.new_centre_id)
    if not settings.database_url.startswith('sqlite'):db.execute(select(Booking).where(Booking.id==b.id).with_for_update());db.execute(select(Slot).where(Slot.id==slot.id).with_for_update())
    current=db.scalars(select(Booking).where(Booking.slot_id==slot.id,Booking.status.in_(ACTIVE),Booking.id!=b.id)).all()
    if target.status!='OPEN' or len(current)>=slot.capacity or sum(x.quantity for x in current)+b.quantity>slot.quantity_capacity:raise HTTPException(409,'The alternative window is no longer available. Your existing booking is safe.')
    old=b.centre_id;b.centre_id=target.id;b.slot_id=slot.id;b.status='CONFIRMED';b.reassigned_at=now();p.status='ACCEPTED';p.decided_at=now();p.channel=channel;ev=event(db,'REBALANCE_ACCEPTED',target.id,farmer.id,{'proposal_id':p.id,'old_centre_id':old,'new_centre_id':target.id,'booking_id':b.id});audit(db,actor,'REBALANCE_ACCEPTED',p.id,{'centre_id':old},{'centre_id':target.id},ev.correlation_id);message(db,farmer,'REBALANCE_CONFIRMED',f'KISH switch confirmed. Your token {b.token} is now assigned to {target.name}.');await broadcast_event(db,ev);await hub.publish([f'centre:{old}'],event_response(ev));return {'status':p.status,'booking':dto_booking(db,b)}

@app.post('/api/v1/webhooks/sms/inbound')
async def sms_inbound(body:SMSInbound,x_webhook_secret:str=Header('',alias='X-Webhook-Secret'),db:Session=Depends(get_db)):
    if not hmac.compare_digest(x_webhook_secret,settings.sms_secret):raise HTTPException(401,'Invalid webhook signature.')
    fingerprint=sha256(body.model_dump_json().encode()).hexdigest();previous=db.scalar(select(Idempotency).where(Idempotency.key==f'sms:{body.message_id}'))
    if previous:return previous.result
    f=db.scalar(select(Farmer).where(Farmer.phone==body.from_phone,Farmer.status=='ACTIVE'))
    if not f:result={'reply':'This phone is not registered with an active KISH farmer account.'};db.add(Idempotency(key=f'sms:{body.message_id}',fingerprint=fingerprint,result=result));return result
    text=body.body.strip().upper();b=db.scalar(select(Booking).where(Booking.farmer_id==f.id,Booking.status.in_(ACTIVE)).order_by(Booking.created_at.desc()))
    if re.fullmatch(r'[12]\s+\d{4}',text):
        action='accept' if text[0]=='1' else 'decline';p=db.scalar(select(Proposal).join(Booking).where(Booking.farmer_id==f.id,Proposal.status=='PROPOSED').order_by(Proposal.created_at.desc()));
        if not p:result={'reply':'There is no active switch proposal.'}
        else:
            try:out=await decision(db,p.id,action,text[-4:],f,None,'SMS');result={'reply':f'Your centre switch was {out["status"].lower()}.'}
            except HTTPException as exc:result={'reply':exc.detail}
    elif text=='TOKEN':result={'reply':f'Token {b.token}; {db.get(Centre,b.centre_id).name}; arrival {datetime.fromtimestamp(db.get(Slot,b.slot_id).start).strftime("%H:%M")}; status {b.status}.'} if b else {'reply':'No active token.'}
    elif text=='QUEUE':result={'reply':f'Token {b.token}; {dto_booking(db,b)["people_ahead"]} farmers ahead; estimated wait {dto_booking(db,b)["predicted_wait_minutes"]} minutes.'} if b else {'reply':'No active queue entry.'}
    elif text=='STATUS':result={'reply':f'Your current procurement status is {b.status}.'} if b else {'reply':'No active procurement.'}
    elif text=='PAYMENT':
        payment=db.scalar(select(Payment).join(Procurement).join(Booking).where(Booking.farmer_id==f.id).order_by(Payment.created_at.desc()));result={'reply':f'Payment status: {payment.status}. {"SIMULATED DEVELOPMENT PAYMENT." if payment and payment.simulated else ""}'} if payment else {'reply':'No payment record is available.'}
    else:result={'reply':'KISH commands: TOKEN, QUEUE, STATUS, PAYMENT, HELP. For a switch proposal reply 1 CODE or 2 CODE.'}
    db.add(Idempotency(key=f'sms:{body.message_id}',fingerprint=fingerprint,result=result));return result

async def websocket(channel,ws):
    # Browser cookies are validated from the websocket scope; never trust path identity.
    with DbSession() as db:
        try:
            raw=ws.cookies.get('kish_session');s=db.scalar(select(AuthSession).where(AuthSession.token_hash==sha(raw or ''),AuthSession.expires_at>now()));
            if not s:await ws.close(code=4401);return
        except Exception:await ws.close(code=4401);return
    await hub.connect(channel,ws)
    try:
        while True:await ws.receive_text()
    except WebSocketDisconnect:hub.disconnect(channel,ws)
@app.websocket('/ws/farmer')
async def ws_farmer(ws:WebSocket):
    with DbSession() as db:
        raw=ws.cookies.get('kish_session');s=db.scalar(select(AuthSession).where(AuthSession.token_hash==sha(raw or ''),AuthSession.expires_at>now()));u=db.get(User,s.user_id) if s else None;f=user_farmer(db,u) if u and u.role=='FARMER' else None
    if not f:await ws.close(code=4403);return
    await websocket(f'farmer:{f.id}',ws)
@app.websocket('/ws/authority/centre/{centre_id}')
async def ws_authority(centre_id:str,ws:WebSocket): await websocket(f'centre:{centre_id}',ws)
@app.websocket('/ws/admin/network')
async def ws_admin(ws:WebSocket): await websocket('admin:network',ws)
