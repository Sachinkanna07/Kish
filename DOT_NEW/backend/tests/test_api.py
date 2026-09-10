from fastapi.testclient import TestClient
from app.main import app

def test_rbac_and_farmer_otp_flow():
    with TestClient(app) as client:
        requested=client.post('/api/v1/auth/farmer/request-otp',json={'identifier':'FM-10002'})
        assert requested.status_code==200
        verified=client.post('/api/v1/auth/farmer/verify-otp',json={'identifier':'FM-10002','code':'123456'})
        assert verified.status_code==200
        csrf=verified.json()['csrf_token']
        assert client.get('/api/v1/admin/dashboard').status_code==403
        assert client.get('/api/v1/farmer/dashboard').status_code==200
        recommended=client.post('/api/v1/farmer/centres/recommendations',json={'crop':'paddy','quantity':2},headers={'X-CSRF-Token':csrf})
        assert recommended.status_code==200
        choice=recommended.json()['recommended']
        booked=client.post('/api/v1/farmer/bookings',json={'crop':'paddy','quantity':2,'centre_id':choice['centre_id'],'slot_id':choice['slot_id'],'optimizer_id':recommended.json()['optimizer_run_id']},headers={'X-CSRF-Token':csrf,'Idempotency-Key':'test-api-booking'})
        assert booked.status_code==200
        assert booked.json()['booking']['token']

def test_authority_scope_and_admin_simulation():
    with TestClient(app) as client:
        login=client.post('/api/v1/auth/authority/login',json={'login':'authority@kish.local','password':'Authority@123'})
        assert login.status_code==200
        csrf=login.json()['csrf_token'];dash=client.get('/api/v1/authority/dashboard').json();centre=dash['centres'][0]['id']
        operations=client.get('/api/v1/authority/operations',params={'centre_id':centre}).json();wb=next(x for x in operations['resources'] if x['kind']=='WEIGHBRIDGE')
        changed=client.patch(f"/api/v1/authority/resources/{wb['id']}",json={'status':'FAILED','version':wb['version']},headers={'X-CSRF-Token':csrf})
        assert changed.status_code==200
        assert client.get('/api/v1/admin/dashboard').status_code==403
