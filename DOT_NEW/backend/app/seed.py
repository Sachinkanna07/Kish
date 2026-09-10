from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from .models import *
from .security import hash_password

def seed(db):
    if db.scalar(select(User).limit(1)):return
    admin=User(login='admin@kish.local',name='Kish Network Admin',role='ADMIN',password=hash_password('Admin@123'));authority=User(login='authority@kish.local',name='Meena Authority',role='AUTHORITY',password=hash_password('Authority@123'));db.add_all([admin,authority]);db.flush()
    crops=[Crop(code='paddy',name='Paddy',rate=23000),Crop(code='maize',name='Maize',rate=21000),Crop(code='groundnut',name='Groundnut',rate=56000)];db.add_all(crops);db.flush()
    details=[('A','Thanjavur North Mandi','Vallam',10.786,79.137,18,0.88),('B','Kumbakonam Smart Mandi','Kumbakonam',10.961,79.388,30,.95),('C','Papanasam Procurement Centre','Papanasam',10.927,79.27,24,.92)]
    centres=[]
    for code,name,village,lat,lon,capacity,eff in details:
        c=Centre(code=code,name=name,village=village,lat=lat,lon=lon,base_capacity=capacity,efficiency=eff,quantity_capacity=300,crops=['paddy','maize','groundnut'],staff_active=8,staff_planned=8);db.add(c);centres.append(c)
    db.flush();db.add_all(Assignment(user_id=authority.id,centre_id=c.id) for c in centres)
    start=datetime.now(timezone.utc).replace(minute=0,second=0,microsecond=0)+timedelta(hours=1)
    for c in centres:
        db.add_all([Resource(centre_id=c.id,code='WB-01',kind='WEIGHBRIDGE',status='ACTIVE',rate=12),Resource(centre_id=c.id,code='WB-02',kind='WEIGHBRIDGE',status='ACTIVE',rate=12),Resource(centre_id=c.id,code='QC-01',kind='QUALITY_COUNTER',status='ACTIVE',rate=16)])
        db.add_all(Slot(centre_id=c.id,start=(start+timedelta(hours=i)).timestamp(),end=(start+timedelta(hours=i+1)).timestamp(),capacity=14,quantity_capacity=70) for i in range(8))
        db.add_all(History(centre_id=c.id,hour=h,arrivals=6+(h%6),service_minutes=4.5+(h%3),no_shows=h%2) for h in range(8,18))
    db.flush()
    for n in range(1,26):
        u=User(login=f'farmer{n}@kish.local',name=f'Demo Farmer {n}',role='FARMER');db.add(u);db.flush();f=Farmer(user_id=u.id,code=f'FM-{10000+n}',phone=f'900000{n:04d}',email=f'farmer{n}@kish.local',village='Vallam',crops=['paddy','maize'],registered_by=authority.id,verified_at=now(),lat=10.79+n*.002,lon=79.14+n*.002);db.add(f)
    db.flush()
