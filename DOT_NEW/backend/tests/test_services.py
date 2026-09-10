import os
os.environ['DATABASE_URL']='sqlite:///./test_kish.db'
from app.db import Base, engine, Session
from app.seed import seed
from app.models import Centre, Farmer, Crop, Booking, Proposal, User, Slot
from app.services import centre_metrics, run_optimization

def setup_module():
    Base.metadata.drop_all(engine);Base.metadata.create_all(engine)
    with Session() as db:seed(db);db.commit()
def test_capacity_and_optimizer_have_real_candidates():
    with Session() as db:
        c=db.query(Centre).filter_by(code='B').one();m=centre_metrics(db,c);assert m['effective_capacity']>0 and m['wait_minutes']>=0
        f=db.query(Farmer).first();run,candidates,selected=run_optimization(db,f,'paddy',2);assert run.id and selected and selected['centre_id'] in [x['centre_id'] for x in candidates]
def test_farmer_has_single_active_booking_constraint():
    with Session() as db:
        f=db.query(Farmer).first();c=db.query(Centre).first();crop=db.query(Crop).filter_by(code='paddy').one();slot=db.query(Slot).filter_by(centre_id=c.id).first();db.add(Booking(farmer_id=f.id,centre_id=c.id,crop_id=crop.id,slot_id=slot.id,quantity=1,token='TEST-ONE'));db.commit()
        db.add(Booking(farmer_id=f.id,centre_id=c.id,crop_id=crop.id,slot_id=slot.id,quantity=1,token='TEST-TWO'))
        try:db.commit();assert False,'expected active booking constraint'
        except Exception:db.rollback()
