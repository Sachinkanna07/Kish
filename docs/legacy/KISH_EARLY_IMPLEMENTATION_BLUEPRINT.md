> **Archive note:** This is an earlier implementation blueprint retained for historical reference. The current source of truth is [KISH_IMPLEMENTATION_BLUEPRINT.md](../../KISH_IMPLEMENTATION_BLUEPRINT.md).

# KISH — IMPLEMENTATION BLUEPRINT

## EXECUTIVE SUMMARY
This document provides the **exact technical specifications** for building KISH as a unified website platform with three role-based interfaces, shared database, real-time intelligence, and dynamic rebalancing.

**Tech Stack:**
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Database: PostgreSQL
- Real-time: Redis + WebSockets
- AI/Optimization: XGBoost/scikit-learn + OR-Tools
- Deployment: Docker

**Timeline:** Phases 1–7 (sequential)

---

## PHASE 1 — FOUNDATION (Days 1–3)

### 1.1 PROJECT STRUCTURE

```
smart-mandi/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── (auth)/             # Shared auth routes
│   │   │   └── login/
│   │   ├── farmer/
│   │   │   ├── dashboard/
│   │   │   ├── centres/
│   │   │   ├── booking/
│   │   │   ├── token/
│   │   │   ├── queue/
│   │   │   ├── history/
│   │   │   └── profile/
│   │   ├── authority/
│   │   │   ├── dashboard/
│   │   │   ├── farmer-registry/
│   │   │   ├── operations/
│   │   │   ├── queue/
│   │   │   ├── weighbridge/
│   │   │   ├── procurement/
│   │   │   └── quality/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── network-map/
│   │   │   ├── centre-monitoring/
│   │   │   ├── analytics/
│   │   │   ├── rebalancing/
│   │   │   └── reports/
│   │   ├── api/
│   │   │   └── [endpoints]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── farmer/
│   │   ├── authority/
│   │   ├── admin/
│   │   ├── common/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   ├── auth.ts
│   │   └── types.ts
│   ├── context/
│   ├── styles/
│   ├── middleware.ts
│   └── next.config.js
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   ├── dependencies.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   └── utils.py
│   │   ├── farmers/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── authority/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── admin/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── centres/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── bookings/
│   │   ├── queue/
│   │   ├── procurement/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── events/
│   │   │   ├── processor.py
│   │   │   ├── handlers.py
│   │   │   └── schemas.py
│   │   └── rebalancing/
│   │       ├── routes.py
│   │       ├── engine.py
│   │       ├── optimizer.py
│   │       └── schemas.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── migrations/
│   ├── intelligence/
│   │   ├── prediction/
│   │   │   ├── arrival.py
│   │   │   ├── capacity.py
│   │   │   ├── waittime.py
│   │   │   └── noshow.py
│   │   ├── queue/
│   │   │   └── simulator.py
│   │   ├── optimization/
│   │   │   └── allocator.py
│   │   ├── simulation/
│   │   │   └── generator.py
│   │   ├── features/
│   │   │   └── engineering.py
│   │   ├── models/
│   │   │   ├── arrival_model.pkl
│   │   │   ├── capacity_model.pkl
│   │   │   └── waittime_model.pkl
│   │   └── evaluation/
│   │       └── metrics.py
│   ├── services/
│   │   ├── websocket.py
│   │   ├── redis.py
│   │   ├── notifications.py
│   │   └── audit.py
│   ├── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── docker-compose.yml
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

### 1.2 ENVIRONMENT VARIABLES

#### `.env.backend`
```
DATABASE_URL=postgresql://user:password@localhost:5432/smartmandi
REDIS_URL=redis://localhost:6379/0

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:3000,https://smartmandi.in

LOG_LEVEL=INFO
```

#### `.env.frontend`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_NAME=KISH
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

### 1.3 DATABASE SCHEMA

#### Core Authentication & Users

```sql
-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
('farmer', 'Farmer - Procures at mandis'),
('authority', 'Authority - Operates a centre'),
('admin', 'Admin - Network-level oversight');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Auth tokens
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_type VARCHAR(20) DEFAULT 'bearer',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
```

#### Farmer Registry

```sql
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farmer_id VARCHAR(20) NOT NULL UNIQUE, -- FM-10284
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    village VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    
    eligible_crops TEXT[], -- Array of crop IDs
    farmer_status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    
    registered_by_authority_id UUID REFERENCES authorities(id),
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Farmer history for analytics
CREATE TABLE farmer_arrivals_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    actual_arrival TIMESTAMP,
    no_show BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);
```

#### Authority & Centre Management

```sql
CREATE TABLE authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    authority_name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_name VARCHAR(100) NOT NULL,
    authority_id UUID NOT NULL REFERENCES authorities(id),
    location_lat FLOAT NOT NULL,
    location_lng FLOAT NOT NULL,
    
    base_capacity_per_hour INT DEFAULT 30,
    theoretical_daily_capacity INT,
    
    operating_hours_start TIME DEFAULT '06:00',
    operating_hours_end TIME DEFAULT '18:00',
    
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, offline
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE centre_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    equipment_type VARCHAR(50), -- 'weighbridge', 'quality_counter', etc.
    equipment_number INT,
    status VARCHAR(50) DEFAULT 'active', -- active, failed, maintenance
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE centre_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    total_staff INT DEFAULT 10,
    active_staff INT DEFAULT 10,
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Crops & Market Data

```sql
CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_code VARCHAR(20) NOT NULL UNIQUE,
    crop_name VARCHAR(100) NOT NULL,
    seasonal VARCHAR(50), -- kharif, rabi, zaid
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE market_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id),
    crop_id UUID NOT NULL REFERENCES crops(id),
    rate_per_quintal DECIMAL(10, 2),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Bookings & Slots

```sql
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id),
    slot_date DATE NOT NULL,
    slot_time_start TIME NOT NULL,
    slot_time_end TIME NOT NULL,
    
    max_allocations INT DEFAULT 10,
    current_allocations INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(30) NOT NULL UNIQUE, -- BK-2026-001245
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    crop_id UUID NOT NULL REFERENCES crops(id),
    
    expected_quantity_kg DECIMAL(10, 2),
    
    arrival_window_start TIMESTAMP,
    arrival_window_end TIMESTAMP,
    
    token_id UUID, -- Will reference tokens table
    
    booking_status VARCHAR(50) DEFAULT 'confirmed', 
    -- confirmed, cancelled, completed, rebalanced
    
    allocation_score DECIMAL(5, 2), -- From optimizer
    optimizer_version VARCHAR(20),
    optimizer_run_id UUID,
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL UNIQUE, -- A1042
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    
    qr_code_data TEXT,
    
    token_status VARCHAR(50) DEFAULT 'upcoming', 
    -- upcoming, checked_in, processing, completed, cancelled
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Queue Management

```sql
CREATE TABLE queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES tokens(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    
    queue_position INT,
    
    check_in_time TIMESTAMP,
    start_processing_time TIMESTAMP,
    completion_time TIMESTAMP,
    
    entry_status VARCHAR(50) DEFAULT 'waiting',
    -- waiting, checked_in, weighing, quality_check, completed, cancelled
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Procurement

```sql
CREATE TABLE procurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procurement_id VARCHAR(30) NOT NULL UNIQUE, -- PR-2026-001245
    token_id UUID NOT NULL REFERENCES tokens(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    crop_id UUID NOT NULL REFERENCES crops(id),
    
    expected_quantity_kg DECIMAL(10, 2),
    gross_weight_kg DECIMAL(10, 2),
    tare_weight_kg DECIMAL(10, 2),
    net_weight_kg DECIMAL(10, 2),
    accepted_quantity_kg DECIMAL(10, 2),
    
    quality_moisture DECIMAL(5, 2),
    quality_foreign_matter DECIMAL(5, 2),
    quality_damaged_grain DECIMAL(5, 2),
    quality_grade VARCHAR(10), -- A, B, C
    
    procurement_status VARCHAR(50) DEFAULT 'processing',
    -- processing, accepted, adjusted, rejected
    
    rejection_reason TEXT,
    adjustment_reason TEXT,
    
    rate_per_quintal DECIMAL(10, 2),
    total_amount DECIMAL(15, 2),
    
    authority_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Receipts & Payments

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id VARCHAR(30) NOT NULL UNIQUE, -- R-2026-001245
    procurement_id UUID NOT NULL UNIQUE REFERENCES procurements(id),
    
    pdf_url TEXT,
    qr_verification_code VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(30) NOT NULL UNIQUE, -- PAY-2026-001245
    procurement_id UUID NOT NULL REFERENCES procurements(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    
    amount DECIMAL(15, 2),
    payment_status VARCHAR(50) DEFAULT 'processing',
    -- processing, approved, credited, failed
    
    transaction_id VARCHAR(100),
    transaction_timestamp TIMESTAMP,
    
    payment_method VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### Events & Operations

```sql
CREATE TABLE operational_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    -- equipment_status_changed, staff_changed, queue_updated, etc.
    
    centre_id UUID REFERENCES centres(id),
    user_id UUID REFERENCES users(id), -- Who triggered it
    
    event_data JSONB, -- Flexible schema for event details
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE rebalancing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rebalancing_id VARCHAR(30) NOT NULL UNIQUE,
    
    trigger_event_id UUID NOT NULL REFERENCES operational_events(id),
    trigger_reason VARCHAR(200),
    
    affected_farmer_id UUID NOT NULL REFERENCES farmers(id),
    old_centre_id UUID NOT NULL REFERENCES centres(id),
    old_arrival_window_start TIMESTAMP,
    old_arrival_window_end TIMESTAMP,
    
    new_centre_id UUID NOT NULL REFERENCES centres(id),
    new_arrival_window_start TIMESTAMP,
    new_arrival_window_end TIMESTAMP,
    
    prediction_before_wait_min INT,
    prediction_after_wait_min INT,
    prediction_before_capacity DECIMAL(5, 2),
    prediction_after_capacity DECIMAL(5, 2),
    
    optimizer_score DECIMAL(5, 2),
    optimizer_run_id UUID,
    
    rebalancing_status VARCHAR(50) DEFAULT 'proposed',
    -- proposed, offered, accepted, rejected, expired
    
    farmer_decision VARCHAR(50), -- accepted, rejected
    farmer_decision_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type VARCHAR(50), -- initial_allocation, rebalancing
    
    run_timestamp TIMESTAMP,
    run_duration_ms INT,
    
    input_farmer_count INT,
    input_centre_count INT,
    
    objective_value DECIMAL(15, 2),
    constraints_satisfied BOOLEAN,
    
    recommendations_count INT,
    recommendations_accepted INT,
    
    optimization_status VARCHAR(50) DEFAULT 'completed',
    
    created_at TIMESTAMP DEFAULT now()
);
```

#### Predictions & Snapshots

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type VARCHAR(50),
    -- arrival, capacity, waittime, noshow
    
    centre_id UUID REFERENCES centres(id),
    prediction_timestamp TIMESTAMP,
    
    input_features JSONB,
    predicted_value FLOAT,
    confidence DECIMAL(5, 2),
    
    model_version VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE centre_capacity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id),
    snapshot_time TIMESTAMP,
    
    base_capacity_per_hour INT,
    equipment_availability DECIMAL(5, 2),
    staff_availability DECIMAL(5, 2),
    quality_counter_availability DECIMAL(5, 2),
    operational_efficiency DECIMAL(5, 2),
    
    effective_capacity_per_hour DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE queue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES centres(id),
    snapshot_time TIMESTAMP,
    
    queue_length INT,
    expected_wait_minutes INT,
    congestion_level VARCHAR(50), -- LOW, MEDIUM, HIGH, CRITICAL
    
    current_processing_rate INT,
    
    created_at TIMESTAMP DEFAULT now()
);
```

#### Notifications & Audit

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50),
    -- booking_confirmed, rebalancing_offered, status_update, alert
    
    title VARCHAR(200),
    message TEXT,
    
    related_booking_id UUID REFERENCES bookings(id),
    related_rebalancing_id UUID REFERENCES rebalancing_events(id),
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    
    changes JSONB, -- old_value, new_value
    
    created_at TIMESTAMP DEFAULT now()
);
```

### 1.4 INITIALIZATION SCRIPT

#### `backend/db/seed.sql`

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "plpython3u";

-- Insert roles
INSERT INTO roles (id, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'farmer', 'Farmer - Procures at mandis'),
('00000000-0000-0000-0000-000000000002', 'authority', 'Authority - Operates a centre'),
('00000000-0000-0000-0000-000000000003', 'admin', 'Admin - Network-level oversight');

-- Insert sample crops
INSERT INTO crops (id, crop_code, crop_name, seasonal) VALUES
('00000000-0000-0000-0000-000000000101', 'PADDY', 'Paddy', 'kharif'),
('00000000-0000-0000-0000-000000000102', 'MAIZE', 'Maize', 'kharif'),
('00000000-0000-0000-0000-000000000103', 'WHEAT', 'Wheat', 'rabi'),
('00000000-0000-0000-0000-000000000104', 'COTTON', 'Cotton', 'kharif');

-- Insert demo admin user (admin / admin123)
INSERT INTO users (id, email, role_id, password_hash) VALUES
('00000000-0000-0000-0000-000000000201', 
 'admin@smartmandi.in',
 '00000000-0000-0000-0000-000000000003',
 '$2b$12$example_hash_here');

-- Insert demo authority user (authority1 / pass123)
INSERT INTO users (id, email, phone, role_id, password_hash) VALUES
('00000000-0000-0000-0000-000000000301',
 'authority1@smartmandi.in',
 '9876543210',
 '00000000-0000-0000-0000-000000000002',
 '$2b$12$example_hash_here');

INSERT INTO authorities (id, user_id, authority_name, region, phone, email) VALUES
('00000000-0000-0000-0000-000000000401',
 '00000000-0000-0000-0000-000000000301',
 'Mandi Board - Region A',
 'North District',
 '9876543210',
 'authority1@smartmandi.in');

-- Insert demo centres
INSERT INTO centres (id, centre_name, authority_id, location_lat, location_lng, base_capacity_per_hour) VALUES
('00000000-0000-0000-0000-000000000501',
 'Mandi A',
 '00000000-0000-0000-0000-000000000401',
 28.7041, 77.1025, 30),
('00000000-0000-0000-0000-000000000502',
 'Mandi B',
 '00000000-0000-0000-0000-000000000401',
 28.6139, 77.2090, 25),
('00000000-0000-0000-0000-000000000503',
 'Mandi C',
 '00000000-0000-0000-0000-000000000401',
 28.5244, 77.1855, 35);

-- Insert centre equipment
INSERT INTO centre_equipment (centre_id, equipment_type, equipment_number, status) VALUES
('00000000-0000-0000-0000-000000000501', 'weighbridge', 1, 'active'),
('00000000-0000-0000-0000-000000000501', 'weighbridge', 2, 'active'),
('00000000-0000-0000-0000-000000000501', 'weighbridge', 3, 'active'),
('00000000-0000-0000-0000-000000000501', 'quality_counter', 1, 'active'),
('00000000-0000-0000-0000-000000000501', 'quality_counter', 2, 'active');

INSERT INTO centre_staff (centre_id, total_staff, active_staff) VALUES
('00000000-0000-0000-0000-000000000501', 10, 8),
('00000000-0000-0000-0000-000000000502', 8, 7),
('00000000-0000-0000-0000-000000000503', 12, 10);

-- Insert demo farmers (registered by authority)
INSERT INTO users (id, email, phone, role_id, password_hash) VALUES
('00000000-0000-0000-0000-000000000601',
 'ravi.farmer@smartmandi.in',
 '9111111111',
 '00000000-0000-0000-0000-000000000001',
 '$2b$12$example_hash_here'),
('00000000-0000-0000-0000-000000000602',
 'kumar.farmer@smartmandi.in',
 '9222222222',
 '00000000-0000-0000-0000-000000000001',
 '$2b$12$example_hash_here');

INSERT INTO farmers (id, user_id, farmer_id, name, phone, email, village, district, eligible_crops, registered_by_authority_id) VALUES
('00000000-0000-0000-0000-000000000701',
 '00000000-0000-0000-0000-000000000601',
 'FM-10284',
 'Ravi Kumar',
 '9111111111',
 'ravi.farmer@smartmandi.in',
 'Village A',
 'North District',
 ARRAY['00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102'],
 '00000000-0000-0000-0000-000000000401'),
('00000000-0000-0000-0000-000000000702',
 '00000000-0000-0000-0000-000000000602',
 'FM-10285',
 'Kumar Singh',
 '9222222222',
 'kumar.farmer@smartmandi.in',
 'Village B',
 'North District',
 ARRAY['00000000-0000-0000-0000-000000000103'],
 '00000000-0000-0000-0000-000000000401');

-- Insert market rates
INSERT INTO market_rates (centre_id, crop_id, rate_per_quintal) VALUES
('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101', 2850),
('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000101', 2820),
('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000101', 2880);
```

### 1.5 AUTHENTICATION FLOW

#### Core Login Logic

```python
# backend/app/auth/routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import timedelta
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
async def login(
    identifier: str,  # farmer_id, email, phone
    password: str,
    db: Session = Depends(get_db)
):
    """
    Universal login endpoint.
    System automatically determines role and returns appropriate context.
    """
    
    # 1. Find user by identifier (email, phone, or farmer_id)
    user = db.query(User).filter(
        (User.email == identifier) |
        (User.phone == identifier)
    ).first()
    
    if not user:
        # Check if farmer_id
        farmer = db.query(Farmer).filter(Farmer.farmer_id == identifier).first()
        if farmer:
            user = farmer.user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
    # 2. Verify password
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 3. Get role-specific context
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    context = {}
    if role.name == "farmer":
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        context = {
            "farmer_id": str(farmer.id),
            "farmer_registry_id": farmer.farmer_id,
            "eligible_centres": farmer.eligible_centres,  # computed
        }
    elif role.name == "authority":
        authority = db.query(Authority).filter(Authority.user_id == user.id).first()
        centres = db.query(Centre).filter(Centre.authority_id == authority.id).all()
        context = {
            "authority_id": str(authority.id),
            "managed_centres": [str(c.id) for c in centres],
        }
    elif role.name == "admin":
        context = {
            "admin_id": str(user.id),
            "access_level": "network_wide",
        }
    
    # 4. Create JWT token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": role.name,
            **context
        },
        expires_delta=timedelta(minutes=30)
    )
    
    # 5. Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "role": role.name}
    )
    
    # 6. Save refresh token to DB
    token_record = AuthToken(
        user_id=user.id,
        token=refresh_token,
        token_type="bearer",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(token_record)
    db.commit()
    
    # 7. Return response
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role.name,
        "context": context,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "phone": user.phone,
        }
    }
```

---

## PHASE 2 — FARMER INTERFACE (Days 4–7)

### 2.1 ROUTES

```
/farmer/login                    → Login form
/farmer/dashboard               → Home dashboard
/farmer/centres                 → Find centre + compare
/farmer/booking                 → Booking flow
/farmer/token                   → View token + QR
/farmer/queue                   → Live queue position
/farmer/history                 → Past procurements
/farmer/profile                 → Profile settings
/farmer/payments                → Payment status
/farmer/notifications           → Notifications list
```

### 2.2 KEY COMPONENTS

#### Login Page

```typescript
// frontend/app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // Store tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_role", data.role);

      // Redirect based on role
      const roleRoute = {
        farmer: "/farmer/dashboard",
        authority: "/authority/dashboard",
        admin: "/admin/dashboard",
      };

      router.push(roleRoute[data.role]);
    } catch (err) {
      setError("Invalid Farmer ID / Email / Phone or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          KISH
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farmer ID / Email / Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="FM-10284"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Contact your authority to register.
        </p>
      </div>
    </div>
  );
}
```

#### Farmer Dashboard

```typescript
// frontend/app/farmer/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FarmerNav from "@/components/farmer/FarmerNav";

interface FarmerContext {
  farmer_id: string;
  farmer_registry_id: string;
  name: string;
  eligible_crops: string[];
}

interface Booking {
  booking_id: string;
  centre_name: string;
  crop: string;
  token: string;
  arrival_window_start: string;
  status: string;
  expected_wait_min: number;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [context, setContext] = useState<FarmerContext | null>(null);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("user_role");

      if (!token || role !== "farmer") {
        router.push("/login");
        return;
      }

      try {
        // Fetch farmer context
        const response = await fetch("/api/farmers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unauthorized");

        const data = await response.json();
        setContext(data);

        // Fetch upcoming booking
        const bookingRes = await fetch("/api/farmers/me/upcoming-booking", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bookingRes.ok) {
          const booking = await bookingRes.json();
          setUpcomingBooking(booking);
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!context) return <div>Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <FarmerNav />

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600">Good morning,</p>
          <h1 className="text-3xl font-bold text-gray-800">{context.name}</h1>
          <p className="text-gray-500 mt-1">
            Farmer ID: <span className="font-semibold">{context.farmer_registry_id}</span>
          </p>
        </div>

        {upcomingBooking ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Today's Procurement</h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-gray-600 text-sm">Recommended Centre</p>
                <p className="text-lg font-semibold">{upcomingBooking.centre_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Token</p>
                <p className="text-lg font-semibold">{upcomingBooking.token}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Expected Wait</p>
                <p className="text-lg font-semibold">{upcomingBooking.expected_wait_min} min</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="text-lg font-semibold text-green-600">{upcomingBooking.status}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <a
                href={`/farmer/token/${upcomingBooking.booking_id}`}
                className="block bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-semibold hover:bg-blue-700"
              >
                View Token & QR
              </a>
              <a
                href="/farmer/queue"
                className="block bg-blue-100 text-blue-600 py-2 px-4 rounded-lg text-center font-semibold hover:bg-blue-200"
              >
                Live Queue
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6 text-center">
            <p className="text-gray-600 mb-4">No upcoming bookings</p>
            <a
              href="/farmer/centres"
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 inline-block"
            >
              Find Centre
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/farmer/history"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Procurement History</h3>
          </a>
          <a
            href="/farmer/payments"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Payments</h3>
          </a>
          <a
            href="/farmer/profile"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Profile</h3>
          </a>
          <a
            href="/farmer/notifications"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </a>
        </div>
      </main>
    </div>
  );
}
```

#### Find Centre Page

```typescript
// frontend/app/farmer/centres/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CentreComparison from "@/components/farmer/CentreComparison";

interface CentreOption {
  centre_id: string;
  centre_name: string;
  distance_km: number;
  queue_length: number;
  expected_wait_min: number;
  capacity_percentage: number;
  congestion_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface RecommendedAllocation {
  centre_id: string;
  centre_name: string;
  arrival_window_start: string;
  arrival_window_end: string;
  expected_wait_min: number;
  same_day_completion_probability: number;
  allocation_score: number;
  reasons: string[];
}

export default function FindCentrePage() {
  const router = useRouter();
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [centres, setCentres] = useState<CentreOption[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendedAllocation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/farmers/centres/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          crop_id: crop,
          expected_quantity_kg: parseFloat(quantity),
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setCentres(data.centres);
      setRecommendation(data.recommendation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Find Centre</h1>

        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select crop</option>
                <option value="paddy">Paddy</option>
                <option value="maize">Maize</option>
                <option value="wheat">Wheat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Quantity (kg)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="8000"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Searching..." : "Find Centres"}
            </button>
          </div>
        </form>

        {recommendation && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">AI Recommended</h2>
            <div className="text-3xl font-bold text-green-600 mb-4">{recommendation.centre_name}</div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Distance</p>
                <p className="text-lg font-semibold">-</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Wait Time</p>
                <p className="text-lg font-semibold">{recommendation.expected_wait_min} min</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Completion Probability</p>
                <p className="text-lg font-semibold">{recommendation.same_day_completion_probability}%</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Congestion</p>
                <p className="text-lg font-semibold text-green-600">Low</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Why?</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {recommendation.reasons.map((reason, idx) => (
                  <li key={idx}>+ {reason}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-1">Recommended Arrival</p>
              <p className="text-lg font-semibold">
                {new Date(recommendation.arrival_window_start).toLocaleTimeString()} –{" "}
                {new Date(recommendation.arrival_window_end).toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/farmer/booking/${recommendation.centre_id}?arrival_window_start=${recommendation.arrival_window_start}`
                )
              }
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
            >
              Accept Recommendation
            </button>
          </div>
        )}

        {centres.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">All Centres</h2>
            <CentreComparison centres={centres} />
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.3 BACKEND API ENDPOINTS

```python
# backend/app/farmers/routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/farmers", tags=["farmers"])

@router.get("/me")
async def get_farmer_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get logged-in farmer's profile"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    return {
        "farmer_id": farmer.id,
        "farmer_registry_id": farmer.farmer_id,
        "name": farmer.name,
        "village": farmer.village,
        "district": farmer.district,
        "eligible_crops": farmer.eligible_crops,
    }

@router.post("/centres/find")
async def find_centres(
    request: FindCentresRequest,  # crop_id, expected_quantity_kg, location (optional)
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find nearby centres with predictions"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    
    # Get all active centres
    centres = db.query(Centre).filter(Centre.status == "active").all()
    
    centre_options = []
    
    for centre in centres:
        # Get current queue length
        queue_length = db.query(func.count(QueueEntry.id)).filter(
            QueueEntry.centre_id == centre.id,
            QueueEntry.entry_status.in_(["waiting", "checked_in"])
        ).scalar()
        
        # Predict wait time
        wait_pred = predict_wait_time(
            centre_id=centre.id,
            queue_length=queue_length,
            crop_id=request.crop_id,
            db=db
        )
        
        # Get effective capacity
        capacity_snapshot = db.query(CentreCapacitySnapshot)\
            .filter(CentreCapacitySnapshot.centre_id == centre.id)\
            .order_by(CentreCapacitySnapshot.snapshot_time.desc())\
            .first()
        
        capacity_pct = (queue_length / capacity_snapshot.effective_capacity_per_hour * 60) \
            if capacity_snapshot else 0
        
        # Determine congestion
        congestion = "LOW"
        if capacity_pct > 70:
            congestion = "MEDIUM"
        if capacity_pct > 85:
            congestion = "HIGH"
        if capacity_pct > 95:
            congestion = "CRITICAL"
        
        centre_options.append({
            "centre_id": str(centre.id),
            "centre_name": centre.centre_name,
            "distance_km": 0,  # Would calculate from farmer location
            "queue_length": queue_length,
            "expected_wait_min": wait_pred,
            "capacity_percentage": min(100, capacity_pct),
            "congestion_level": congestion,
        })
    
    # Sort by expected wait time
    centre_options.sort(key=lambda x: x["expected_wait_min"])
    
    # Get recommendation from optimizer
    best_centre = centre_options[0] if centre_options else None
    
    recommendation = None
    if best_centre:
        recommendation = {
            "centre_id": best_centre["centre_id"],
            "centre_name": best_centre["centre_name"],
            "arrival_window_start": datetime.now().replace(hour=10, minute=40),
            "arrival_window_end": datetime.now().replace(hour=11, minute=0),
            "expected_wait_min": best_centre["expected_wait_min"],
            "same_day_completion_probability": 94,
            "allocation_score": 0.94,
            "reasons": [
                "Lower expected waiting time",
                "Higher processing capacity",
                "Low congestion",
                "Available capacity"
            ]
        }
    
    return {
        "centres": centre_options,
        "recommendation": recommendation
    }

@router.post("/bookings")
async def create_booking(
    request: CreateBookingRequest,  # centre_id, crop_id, expected_quantity_kg
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a booking"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    
    # Generate booking ID
    booking_id = f"BK-{datetime.now().year}-{generate_unique_number()}"
    
    # Generate token number
    token_number = f"A{generate_unique_number()}"
    
    # Create booking
    booking = Booking(
        booking_id=booking_id,
        farmer_id=farmer.id,
        centre_id=request.centre_id,
        crop_id=request.crop_id,
        expected_quantity_kg=request.expected_quantity_kg,
        arrival_window_start=request.arrival_window_start,
        arrival_window_end=request.arrival_window_end,
        booking_status="confirmed",
        allocation_score=request.allocation_score,
        optimizer_version="v1.0",
    )
    db.add(booking)
    db.flush()
    
    # Create token
    token = Token(
        token_number=token_number,
        booking_id=booking.id,
        centre_id=request.centre_id,
        token_status="upcoming",
        qr_code_data=f"smartmandi://{token_number}"
    )
    db.add(token)
    db.flush()
    
    # Create queue entry
    queue_entry = QueueEntry(
        token_id=token.id,
        centre_id=request.centre_id,
        queue_position=get_next_queue_position(request.centre_id, db),
        entry_status="waiting",
    )
    db.add(queue_entry)
    db.commit()
    
    # Send notification
    notification = Notification(
        user_id=current_user.id,
        notification_type="booking_confirmed",
        title="Booking Confirmed",
        message=f"Your booking at {booking.centre.centre_name} is confirmed. Token: {token_number}",
        related_booking_id=booking.id,
    )
    db.add(notification)
    db.commit()
    
    return {
        "booking_id": booking.booking_id,
        "token": token_number,
        "centre": booking.centre.centre_name,
        "status": "confirmed",
    }

@router.get("/me/upcoming-booking")
async def get_upcoming_booking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get farmer's next upcoming booking"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    
    booking = db.query(Booking)\
        .filter(
            Booking.farmer_id == farmer.id,
            Booking.booking_status.in_(["confirmed", "rebalanced"]),
            Booking.arrival_window_start > datetime.now()
        )\
        .order_by(Booking.arrival_window_start)\
        .first()
    
    if not booking:
        return None
    
    token = db.query(Token).filter(Token.booking_id == booking.id).first()
    
    return {
        "booking_id": str(booking.id),
        "centre_name": booking.centre.centre_name,
        "crop": booking.crop.crop_name,
        "token": token.token_number if token else None,
        "arrival_window_start": booking.arrival_window_start,
        "status": "UPCOMING",
        "expected_wait_min": 25,  # From predictions
    }

@router.get("/me/queue/{booking_id}")
async def get_queue_status(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time queue status"""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    token = db.query(Token).filter(Token.booking_id == booking.id).first()
    queue_entry = db.query(QueueEntry).filter(QueueEntry.token_id == token.id).first()
    
    # Count people ahead
    ahead_count = db.query(func.count(QueueEntry.id))\
        .filter(
            QueueEntry.centre_id == booking.centre_id,
            QueueEntry.queue_position < queue_entry.queue_position,
            QueueEntry.entry_status.in_(["waiting", "checked_in"])
        ).scalar()
    
    # Predict remaining wait
    wait_pred = predict_wait_time(
        centre_id=booking.centre_id,
        queue_length=ahead_count + 1,  # Include self
        crop_id=booking.crop_id,
        db=db
    )
    
    return {
        "token": token.token_number,
        "centre": booking.centre.centre_name,
        "your_position": queue_entry.queue_position,
        "ahead_of_you": ahead_count,
        "estimated_wait_min": wait_pred,
        "status": "waiting",
    }
```

---

## PHASE 3 — AUTHORITY INTERFACE (Days 8–11)

### 3.1 ROUTES

```
/authority/login                → Login
/authority/dashboard            → Home
/authority/farmer-registry      → Farmer management
/authority/operations           → Live operations
/authority/queue                → Queue control
/authority/weighbridge          → Equipment status
/authority/procurement          → Weighment entry
/authority/quality              → Quality check
/authority/receipts             → Receipt management
```

### 3.2 KEY COMPONENTS

#### Authority Dashboard

```typescript
// frontend/app/authority/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthorityNav from "@/components/authority/AuthorityNav";
import OperationalsCard from "@/components/authority/OperationalsCard";

interface CentreOperations {
  centre_id: string;
  centre_name: string;
  status: string;
  queue_count: number;
  processing_count: number;
  completed_count: number;
  expected_count: number;
  weighbridges_active: number;
  weighbridges_total: number;
  quality_counters_active: number;
  quality_counters_total: number;
  staff_active: number;
  staff_total: number;
  processing_rate: number;
}

export default function AuthorityDashboard() {
  const router = useRouter();
  const [operations, setOperations] = useState<CentreOperations | null>(null);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    if (!token || role !== "authority") {
      router.push("/login");
      return;
    }

    // Fetch initial operations data
    const fetchOperations = async () => {
      try {
        const response = await fetch("/api/authority/operations/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unauthorized");

        const data = await response.json();
        setOperations(data);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchOperations();

    // Connect to WebSocket for real-time updates
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/authority/operations?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOperations(data);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!operations) return <div>Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthorityNav centreId={operations.centre_id} />

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{operations.centre_name}</h1>
              <p className="text-gray-600 mt-1">
                Status:{" "}
                <span className={`font-semibold ${operations.status === "active" ? "text-green-600" : "text-red-600"}`}>
                  {operations.status.toUpperCase()}
                </span>
              </p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Settings
            </button>
          </div>
        </div>

        <OperationalsCard operations={operations} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <a
            href={`/authority/farmer-registry`}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Farmer Registry</h3>
            <p className="text-gray-600 text-sm mt-1">Manage farmers</p>
          </a>
          <a
            href={`/authority/queue`}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Queue Control</h3>
            <p className="text-gray-600 text-sm mt-1">Current processing</p>
          </a>
          <a
            href={`/authority/weighbridge`}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Weighbridge Status</h3>
            <p className="text-gray-600 text-sm mt-1">Equipment control</p>
          </a>
          <a
            href={`/authority/procurement`}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Procurement</h3>
            <p className="text-gray-600 text-sm mt-1">Record weighments</p>
          </a>
        </div>
      </main>
    </div>
  );
}
```

#### Queue Control

```typescript
// frontend/app/authority/queue/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QueueFarmer {
  queue_position: number;
  farmer_name: string;
  token: string;
  crop: string;
  expected_quantity: number;
  status: "waiting" | "checked_in" | "weighing" | "quality_check" | "completed";
}

export default function QueueControlPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueFarmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetchQueue = async () => {
      try {
        const response = await fetch("/api/authority/queue", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch queue");

        const data = await response.json();
        setQueue(data.queue);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();

    // Poll every 5 seconds
    const interval = setInterval(fetchQueue, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async (farmerToken: string) => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch("/api/authority/queue/call-next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: farmerToken, status: "checked_in" }),
      });

      if (!response.ok) throw new Error("Failed to update queue");

      // Refresh queue
      const queueRes = await fetch("/api/authority/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await queueRes.json();
      setQueue(data.queue);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Queue Control</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Farmer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Token</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Crop</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((farmer) => (
                <tr key={farmer.queue_position} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-700">{farmer.queue_position}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{farmer.farmer_name}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-800">{farmer.token}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{farmer.crop}</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        farmer.status === "waiting"
                          ? "bg-yellow-100 text-yellow-800"
                          : farmer.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {farmer.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {farmer.status === "waiting" && (
                      <button
                        onClick={() => handleCallNext(farmer.token)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
                      >
                        Call Next
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 BACKEND: OPERATIONS ENDPOINTS

```python
# backend/app/authority/routes.py

@router.get("/operations/me")
async def get_centre_operations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time operations for authority's centre"""
    authority = db.query(Authority).filter(Authority.user_id == current_user.id).first()
    centre = db.query(Centre).filter(Centre.authority_id == authority.id).first()
    
    # Get queue stats
    waiting = db.query(func.count(QueueEntry.id))\
        .filter(QueueEntry.centre_id == centre.id, QueueEntry.entry_status == "waiting")\
        .scalar()
    
    processing = db.query(func.count(QueueEntry.id))\
        .filter(QueueEntry.centre_id == centre.id, QueueEntry.entry_status.in_(["checked_in", "weighing", "quality_check"]))\
        .scalar()
    
    completed = db.query(func.count(QueueEntry.id))\
        .filter(QueueEntry.centre_id == centre.id, QueueEntry.entry_status == "completed")\
        .scalar()
    
    # Get equipment status
    weighbridges = db.query(CentreEquipment)\
        .filter(CentreEquipment.centre_id == centre.id, CentreEquipment.equipment_type == "weighbridge")\
        .all()
    
    active_weighbridges = sum(1 for w in weighbridges if w.status == "active")
    
    quality_counters = db.query(CentreEquipment)\
        .filter(CentreEquipment.centre_id == centre.id, CentreEquipment.equipment_type == "quality_counter")\
        .all()
    
    active_quality = sum(1 for q in quality_counters if q.status == "active")
    
    # Get staff status
    staff = db.query(CentreStaff).filter(CentreStaff.centre_id == centre.id).first()
    
    return {
        "centre_id": str(centre.id),
        "centre_name": centre.centre_name,
        "status": centre.status,
        "queue_count": waiting,
        "processing_count": processing,
        "completed_count": completed,
        "expected_count": 21,  # Forecast
        "weighbridges_active": active_weighbridges,
        "weighbridges_total": len(weighbridges),
        "quality_counters_active": active_quality,
        "quality_counters_total": len(quality_counters),
        "staff_active": staff.active_staff if staff else 0,
        "staff_total": staff.total_staff if staff else 0,
        "processing_rate": 20,  # farmers/hour
    }

@router.get("/queue")
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current queue for authority's centre"""
    authority = db.query(Authority).filter(Authority.user_id == current_user.id).first()
    centre = db.query(Centre).filter(Centre.authority_id == authority.id).first()
    
    queue_entries = db.query(QueueEntry)\
        .filter(
            QueueEntry.centre_id == centre.id,
            QueueEntry.entry_status.in_(["waiting", "checked_in"])
        )\
        .order_by(QueueEntry.queue_position)\
        .all()
    
    queue = []
    for entry in queue_entries:
        token = db.query(Token).filter(Token.id == entry.token_id).first()
        booking = db.query(Booking).filter(Booking.id == token.booking_id).first()
        farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
        
        queue.append({
            "queue_position": entry.queue_position,
            "farmer_name": farmer.name,
            "token": token.token_number,
            "crop": booking.crop.crop_name,
            "expected_quantity": booking.expected_quantity_kg,
            "status": entry.entry_status,
        })
    
    return {"queue": queue}

@router.post("/queue/call-next")
async def call_next_farmer(
    request: CallNextRequest,  # token, status
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move farmer to next stage in queue"""
    token = db.query(Token).filter(Token.token_number == request.token).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    queue_entry = db.query(QueueEntry).filter(QueueEntry.token_id == token.id).first()
    queue_entry.entry_status = request.status
    
    if request.status == "checked_in":
        queue_entry.check_in_time = datetime.now()
    elif request.status == "weighing":
        queue_entry.start_processing_time = datetime.now()
    elif request.status == "completed":
        queue_entry.completion_time = datetime.now()
    
    db.commit()
    
    # Trigger event
    event = OperationalEvent(
        event_type="queue_status_changed",
        centre_id=token.centre_id,
        user_id=current_user.id,
        event_data={"token": request.token, "status": request.status}
    )
    db.add(event)
    db.commit()
    
    # Notify farmer
    booking = db.query(Booking).filter(Booking.id == token.booking_id).first()
    notification = Notification(
        user_id=booking.farmer.user_id,
        notification_type="status_update",
        title="Queue Update",
        message=f"Your status has been updated to {request.status}",
        related_booking_id=booking.id,
    )
    db.add(notification)
    db.commit()
    
    return {"status": "updated"}

@router.put("/weighbridge/{equipment_id}/status")
async def update_weighbridge_status(
    equipment_id: str,
    status: str,  # active, failed, maintenance
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update weighbridge status"""
    equipment = db.query(CentreEquipment).filter(CentreEquipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    old_status = equipment.status
    equipment.status = status
    equipment.updated_at = datetime.now()
    db.commit()
    
    # Trigger operational event
    event = OperationalEvent(
        event_type="equipment_status_changed",
        centre_id=equipment.centre_id,
        user_id=current_user.id,
        event_data={
            "equipment_type": equipment.equipment_type,
            "equipment_number": equipment.equipment_number,
            "old_status": old_status,
            "new_status": status
        }
    )
    db.add(event)
    db.commit()
    
    # THIS TRIGGERS DYNAMIC REBALANCING
    # Process event through intelligence engine
    process_operational_event(event, db)
    
    return {"status": "updated"}
```

---

## PHASE 4 — ADMIN INTERFACE (Days 12–14)

### 4.1 ROUTES

```
/admin/login                     → Login
/admin/dashboard                 → Home
/admin/network-map               → Live centre map
/admin/centre-monitoring         → Centre details
/admin/analytics                 → Reports + charts
/admin/rebalancing               → Rebalancing events
/admin/simulator                 → Demo simulator
```

### 4.2 ADMIN DASHBOARD (High-Level Overview)

```typescript
// frontend/app/admin/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import NetworkKPIs from "@/components/admin/NetworkKPIs";
import CentreMap from "@/components/admin/CentreMap";

interface NetworkStats {
  active_centres: number;
  farmers_today: number;
  currently_waiting: number;
  currently_processing: number;
  avg_wait_min: number;
  procured_today_tonnes: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetchStats = async () => {
      const response = await fetch("/api/admin/network/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setStats(data);
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Network Overview</h1>

        {stats && <NetworkKPIs stats={stats} />}

        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Live Mandi Map</h2>
          <CentreMap />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <a
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Analytics</h3>
          </a>
          <a
            href="/admin/simulator"
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-gray-800">Demo Simulator</h3>
          </a>
        </div>
      </main>
    </div>
  );
}
```

### 4.3 DEMO SIMULATOR

```typescript
// frontend/app/admin/simulator/page.tsx

"use client";

import { useState } from "react";

type SimulationScenario = 
  | "normal"
  | "farmer_surge"
  | "weighbridge_failure"
  | "staff_shortage"
  | "processing_delay";

export default function SimulatorPage() {
  const [scenario, setScenario] = useState<SimulationScenario>("normal");
  const [running, setRunning] = useState(false);

  const handleRunSimulation = async (selectedScenario: SimulationScenario) => {
    setRunning(true);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("/api/admin/simulator/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scenario: selectedScenario }),
      });

      if (!response.ok) throw new Error("Simulation failed");

      const data = await response.json();

      // Show results
      alert(`Simulation complete! Results: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Simulation Control</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as SimulationScenario)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={running}
            >
              <option value="normal">Normal Operation</option>
              <option value="farmer_surge">Simulate Farmer Surge</option>
              <option value="weighbridge_failure">Simulate Weighbridge Failure</option>
              <option value="staff_shortage">Simulate Staff Shortage</option>
              <option value="processing_delay">Simulate Processing Delay</option>
            </select>
          </div>

          <button
            onClick={() => handleRunSimulation(scenario)}
            disabled={running}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {running ? "Running..." : "Run Simulation"}
          </button>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Scenario Descriptions</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Farmer Surge</h3>
              <p className="text-gray-600 text-sm">Simulate 50% increase in farmer arrivals</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Weighbridge Failure</h3>
              <p className="text-gray-600 text-sm">Disable one weighbridge; watch rebalancing trigger</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Staff Shortage</h3>
              <p className="text-gray-600 text-sm">Reduce staff availability; observe capacity drop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 5 — INTELLIGENCE LAYER (Days 15–18)

### 5.1 PREDICTION MODELS

```python
# backend/intelligence/prediction/arrival.py

import pandas as pd
import xgboost as xgb
from datetime import datetime

class ArrivalPredictor:
    def __init__(self, model_path=None):
        if model_path:
            self.model = xgb.XGBRegressor()
            self.model.load_model(model_path)
        else:
            self.model = None
    
    def prepare_features(self, centre_id, crop_id, booking_time, db):
        """Prepare features for prediction"""
        # Historical data
        history = db.query(FarmerArrivalsHistory)\
            .filter(
                FarmerArrivalsHistory.centre_id == centre_id,
                FarmerArrivalsHistory.crop_id == crop_id
            )\
            .order_by(FarmerArrivalsHistory.actual_arrival.desc())\
            .limit(100)\
            .all()
        
        # Feature engineering
        features = pd.DataFrame()
        
        # Temporal
        features['hour'] = booking_time.hour
        features['day_of_week'] = booking_time.weekday()
        features['is_weekend'] = booking_time.weekday() >= 5
        
        # Historical patterns
        if history:
            arrival_times = [h.actual_arrival for h in history]
            features['avg_arrival_delay'] = (arrival_times[-1] - booking_time).total_seconds() / 60
        
        # Current conditions
        current_queue = db.query(QueueEntry)\
            .filter(
                QueueEntry.centre_id == centre_id,
                QueueEntry.entry_status.in_(["waiting", "checked_in"])
            ).count()
        
        features['current_queue'] = current_queue
        
        return features
    
    def predict(self, centre_id, crop_id, booking_time, db):
        """Predict actual arrival time"""
        features = self.prepare_features(centre_id, crop_id, booking_time, db)
        
        if self.model:
            predicted_delay_min = self.model.predict(features)[0]
            predicted_arrival = booking_time + timedelta(minutes=predicted_delay_min)
        else:
            # Fallback: assume exact booking time
            predicted_arrival = booking_time
        
        return predicted_arrival

# backend/intelligence/prediction/capacity.py

class CapacityPredictor:
    def calculate_effective_capacity(self, centre_id, db):
        """
        Effective Capacity =
        Base Capacity
        × Equipment Availability
        × Staff Availability
        × Quality Counter Availability
        × Operational Efficiency
        """
        centre = db.query(Centre).filter(Centre.id == centre_id).first()
        
        base_capacity = centre.base_capacity_per_hour
        
        # Equipment availability
        weighbridges = db.query(CentreEquipment)\
            .filter(
                CentreEquipment.centre_id == centre_id,
                CentreEquipment.equipment_type == "weighbridge"
            ).all()
        
        active_weighbridges = sum(1 for w in weighbridges if w.status == "active")
        equipment_availability = active_weighbridges / max(len(weighbridges), 1)
        
        # Staff availability
        staff = db.query(CentreStaff).filter(CentreStaff.centre_id == centre_id).first()
        staff_availability = staff.active_staff / max(staff.total_staff, 1) if staff else 0.8
        
        # Quality counter availability
        quality_counters = db.query(CentreEquipment)\
            .filter(
                CentreEquipment.centre_id == centre_id,
                CentreEquipment.equipment_type == "quality_counter"
            ).all()
        
        active_quality = sum(1 for q in quality_counters if q.status == "active")
        quality_availability = active_quality / max(len(quality_counters), 1)
        
        # Operational efficiency
        operational_efficiency = 0.90  # Can be learned
        
        # Calculate
        effective_capacity = (
            base_capacity *
            equipment_availability *
            staff_availability *
            quality_availability *
            operational_efficiency
        )
        
        # Store snapshot
        snapshot = CentreCapacitySnapshot(
            centre_id=centre_id,
            snapshot_time=datetime.now(),
            base_capacity_per_hour=base_capacity,
            equipment_availability=equipment_availability,
            staff_availability=staff_availability,
            quality_counter_availability=quality_availability,
            operational_efficiency=operational_efficiency,
            effective_capacity_per_hour=effective_capacity
        )
        db.add(snapshot)
        db.commit()
        
        return effective_capacity

# backend/intelligence/prediction/waittime.py

class WaitTimePredictor:
    def predict_wait_time(self, centre_id, queue_length, effective_capacity, db):
        """
        Estimate wait time based on queue and capacity
        """
        service_time_per_farmer = 60 / effective_capacity  # minutes
        
        expected_wait_min = queue_length * service_time_per_farmer
        
        # Store prediction
        prediction = Prediction(
            prediction_type="waittime",
            centre_id=centre_id,
            prediction_timestamp=datetime.now(),
            input_features={"queue_length": queue_length, "effective_capacity": effective_capacity},
            predicted_value=expected_wait_min,
            confidence=0.85,
            model_version="v1.0"
        )
        db.add(prediction)
        db.commit()
        
        return expected_wait_min
```

### 5.2 OPTIMIZATION ENGINE

```python
# backend/intelligence/optimization/allocator.py

from ortools.linear_solver import pywraplp

class SmartAllocator:
    def optimize_allocations(self, farmer_requests, centres, db):
        """
        Optimize farmer → centre allocations using OR-Tools
        
        Minimize:
        - waiting time
        - travel distance
        - congestion
        - overload
        
        Maximize:
        - same-day completion
        - utilization
        """
        
        # Create solver
        solver = pywraplp.Solver.CreateSolver("SCIP")
        
        # Decision variables: allocation[farmer][centre]
        allocation = {}
        for i, farmer in enumerate(farmer_requests):
            for j, centre in enumerate(centres):
                allocation[i, j] = solver.BoolVar(f"alloc_{i}_{j}")
        
        # Constraint 1: Each farmer assigned to exactly one centre
        for i in range(len(farmer_requests)):
            solver.Add(sum(allocation[i, j] for j in range(len(centres))) == 1)
        
        # Constraint 2: Don't exceed centre capacity
        for j, centre in enumerate(centres):
            effective_cap = centres[j]['effective_capacity']
            solver.Add(
                sum(allocation[i, j] for i in range(len(farmer_requests))) <= effective_cap
            )
        
        # Objective: Minimize total wait time + travel + congestion
        objective = 0
        
        for i, farmer in enumerate(farmer_requests):
            for j, centre in enumerate(centres):
                wait_time = centres[j]['predicted_wait']
                distance = calculate_distance(farmer['location'], centre['location'])
                
                cost = wait_time + (distance * 0.1)  # Weighted
                objective += allocation[i, j] * cost
        
        solver.Minimize(objective)
        
        # Solve
        status = solver.Solve()
        
        if status == pywraplp.Solver.OPTIMAL:
            recommendations = []
            
            for i in range(len(farmer_requests)):
                for j in range(len(centres)):
                    if allocation[i, j].solution_value() > 0.5:
                        recommendations.append({
                            "farmer_id": farmer_requests[i]['farmer_id'],
                            "centre_id": centres[j]['centre_id'],
                            "allocation_score": 0.94,
                        })
            
            # Create optimization run record
            opt_run = OptimizationRun(
                run_type="initial_allocation",
                run_timestamp=datetime.now(),
                run_duration_ms=solver.wall_time(),
                input_farmer_count=len(farmer_requests),
                input_centre_count=len(centres),
                objective_value=solver.Objective().Value(),
                constraints_satisfied=True,
                recommendations_count=len(recommendations),
                optimization_status="completed"
            )
            db.add(opt_run)
            db.commit()
            
            return recommendations
        else:
            return []
```

### 5.3 EVENT PROCESSOR

```python
# backend/app/events/processor.py

from fastapi import Depends
from sqlalchemy.orm import Session
import asyncio

class OperationalEventProcessor:
    @staticmethod
    async def process_equipment_status_change(event: OperationalEvent, db: Session):
        """
        When equipment status changes:
        1. Recalculate effective capacity
        2. Recalculate wait-time predictions
        3. Run optimization
        4. Find eligible farmers for rebalancing
        5. Trigger rebalancing offers
        """
        
        centre_id = event.centre_id
        
        # 1. Recalculate effective capacity
        capacity_predictor = CapacityPredictor()
        new_effective_capacity = capacity_predictor.calculate_effective_capacity(centre_id, db)
        
        # 2. Recalculate wait time for all waiting farmers at this centre
        queue_entries = db.query(QueueEntry)\
            .filter(
                QueueEntry.centre_id == centre_id,
                QueueEntry.entry_status == "waiting"
            ).all()
        
        wait_predictor = WaitTimePredictor()
        
        for entry in queue_entries:
            predicted_wait = wait_predictor.predict_wait_time(
                centre_id,
                len(queue_entries),
                new_effective_capacity,
                db
            )
            
            # Update token with new prediction
            token = db.query(Token).filter(Token.id == entry.token_id).first()
            booking = db.query(Booking).filter(Booking.id == token.booking_id).first()
            
            # If wait time significantly changed, trigger rebalancing check
            if predicted_wait > 60:  # threshold
                OperationalEventProcessor.check_rebalancing_eligibility(
                    booking.farmer_id,
                    centre_id,
                    event,
                    predicted_wait,
                    db
                )
    
    @staticmethod
    def check_rebalancing_eligibility(
        farmer_id: UUID,
        current_centre_id: UUID,
        trigger_event: OperationalEvent,
        new_wait_pred: float,
        db: Session
    ):
        """Check if farmer is eligible for rebalancing"""
        
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        booking = db.query(Booking)\
            .filter(
                Booking.farmer_id == farmer_id,
                Booking.centre_id == current_centre_id,
                Booking.booking_status.in_(["confirmed", "rebalanced"])
            ).first()
        
        if not booking:
            return
        
        # Eligibility checks
        queue_entry = db.query(QueueEntry)\
            .join(Token, Token.id == QueueEntry.token_id)\
            .filter(Token.booking_id == booking.id)\
            .first()
        
        # NOT eligible if already processing or checked in
        if queue_entry.entry_status not in ["waiting"]:
            return
        
        # NOT eligible if very close to arrival window
        if datetime.now() > booking.arrival_window_start - timedelta(minutes=30):
            return
        
        # ELIGIBLE for rebalancing
        OperationalEventProcessor.trigger_rebalancing_algorithm(
            farmer_id,
            booking,
            trigger_event,
            new_wait_pred,
            db
        )
    
    @staticmethod
    def trigger_rebalancing_algorithm(
        farmer_id: UUID,
        current_booking: Booking,
        trigger_event: OperationalEvent,
        current_centre_wait: float,
        db: Session
    ):
        """
        Run allocation optimization for alternative centre
        """
        
        # Get all alternative centres
        centres = db.query(Centre).filter(Centre.status == "active").all()
        
        allocator = SmartAllocator()
        
        farmer_request = {
            "farmer_id": farmer_id,
            "crop_id": current_booking.crop_id,
            "expected_quantity": current_booking.expected_quantity_kg,
            "location": None,  # Would be actual farmer location
        }
        
        centre_options = []
        
        for centre in centres:
            if centre.id == current_booking.centre_id:
                continue  # Skip current centre
            
            capacity_pred = CapacityPredictor()
            effective_cap = capacity_pred.calculate_effective_capacity(centre.id, db)
            
            queue_len = db.query(func.count(QueueEntry.id))\
                .filter(
                    QueueEntry.centre_id == centre.id,
                    QueueEntry.entry_status.in_(["waiting", "checked_in"])
                ).scalar()
            
            wait_pred = WaitTimePredictor().predict_wait_time(
                centre.id, queue_len, effective_cap, db
            )
            
            centre_options.append({
                "centre_id": centre.id,
                "centre_name": centre.centre_name,
                "effective_capacity": effective_cap,
                "predicted_wait": wait_pred,
                "location": None,
            })
        
        # Find best alternative
        best_alternative = min(centre_options, key=lambda x: x["predicted_wait"])
        
        if best_alternative["predicted_wait"] < current_centre_wait * 0.8:
            # Significant improvement; create rebalancing event
            rebalance_event = RebalancingEvent(
                trigger_event_id=trigger_event.id,
                trigger_reason=f"Equipment failure: predicted wait {current_centre_wait}min → {best_alternative['predicted_wait']}min",
                
                affected_farmer_id=farmer_id,
                old_centre_id=current_booking.centre_id,
                old_arrival_window_start=current_booking.arrival_window_start,
                old_arrival_window_end=current_booking.arrival_window_end,
                
                new_centre_id=best_alternative["centre_id"],
                new_arrival_window_start=datetime.now().replace(hour=10, minute=40),
                new_arrival_window_end=datetime.now().replace(hour=11, minute=0),
                
                prediction_before_wait_min=int(current_centre_wait),
                prediction_after_wait_min=int(best_alternative["predicted_wait"]),
                
                rebalancing_status="proposed",
            )
            db.add(rebalance_event)
            db.commit()
            
            # Send notification to farmer
            user = db.query(User).filter(User.id == db.query(Farmer).filter(Farmer.id == farmer_id).first().user_id).first()
            
            notification = Notification(
                user_id=user.id,
                notification_type="rebalancing_offered",
                title="Better Alternative Available",
                message=f"Your centre is experiencing a delay. We found a better option.",
                related_rebalancing_id=rebalance_event.id,
            )
            db.add(notification)
            db.commit()
            
            # WebSocket push to farmer
            await websocket_manager.notify_farmer(
                user.id,
                {
                    "type": "rebalancing_offered",
                    "rebalancing_id": str(rebalance_event.id),
                    "old_centre": current_booking.centre.centre_name,
                    "new_centre": best_alternative["centre_name"],
                    "wait_reduction": f"{int(current_centre_wait - best_alternative['predicted_wait'])} min",
                }
            )
```

---

## PHASE 6 — DYNAMIC REBALANCING (Days 19–21)

### 6.1 REBALANCING FLOW

```typescript
// frontend/app/farmer/rebalancing-offer/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface RebalancingOffer {
  rebalancing_id: string;
  current_centre: string;
  current_wait_min: number;
  new_centre: string;
  new_wait_min: number;
  travel_difference_km: number;
}

export default function RebalancingOfferPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rebalancingId = searchParams.get("id");
  
  const [offer, setOffer] = useState<RebalancingOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetch Offer = async () => {
      try {
        const response = await fetch(`/api/rebalancing/${rebalancingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        setOffer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [rebalancingId]);

  const handleAccept = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(`/api/rebalancing/${rebalancingId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Accepted! Your new centre is: " + offer?.new_centre);
        router.push("/farmer/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    const token = localStorage.getItem("access_token");

    try {
      await fetch(`/api/rebalancing/${rebalancingId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push("/farmer/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!offer) return <div>Offer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Better Alternative Available
        </h1>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Current Centre</p>
            <p className="text-xl font-semibold text-gray-800">{offer.current_centre}</p>
            <p className="text-red-600 text-sm mt-2">
              Predicted wait: {offer.current_wait_min} min
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Alternative Centre</p>
            <p className="text-xl font-semibold text-gray-800">{offer.new_centre}</p>
            <p className="text-green-600 text-sm mt-2">
              Predicted wait: {offer.new_wait_min} min
            </p>
            {offer.travel_difference_km > 0 && (
              <p className="text-gray-600 text-xs mt-1">
                +{offer.travel_difference_km} km additional travel
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
            >
              Switch to {offer.new_centre}
            </button>

            <button
              onClick={handleReject}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              Keep {offer.current_centre}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 REBALANCING API

```python
# backend/app/rebalancing/routes.py

@router.post("/{rebalancing_id}/accept")
async def accept_rebalancing(
    rebalancing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Farmer accepts rebalancing offer"""
    
    rebalance = db.query(RebalancingEvent).filter(
        RebalancingEvent.id == rebalancing_id
    ).first()
    
    if not rebalance:
        raise HTTPException(status_code=404, detail="Rebalancing not found")
    
    # Update rebalancing event
    rebalance.rebalancing_status = "accepted"
    rebalance.farmer_decision = "accepted"
    rebalance.farmer_decision_time = datetime.now()
    db.commit()
    
    # Update booking
    booking = db.query(Booking).filter(
        Booking.farmer_id == rebalance.affected_farmer_id,
        Booking.centre_id == rebalance.old_centre_id
    ).first()
    
    # Create new booking at new centre
    new_booking = Booking(
        booking_id=f"BK-{datetime.now().year}-{generate_unique_number()}",
        farmer_id=booking.farmer_id,
        centre_id=rebalance.new_centre_id,
        crop_id=booking.crop_id,
        expected_quantity_kg=booking.expected_quantity_kg,
        arrival_window_start=rebalance.new_arrival_window_start,
        arrival_window_end=rebalance.new_arrival_window_end,
        booking_status="rebalanced",
        allocation_score=rebalance.optimizer_score,
    )
    db.add(new_booking)
    db.flush()
    
    # Create new token
    new_token = Token(
        token_number=f"A{generate_unique_number()}",
        booking_id=new_booking.id,
        centre_id=rebalance.new_centre_id,
        token_status="upcoming",
    )
    db.add(new_token)
    db.flush()
    
    # Create new queue entry
    queue_entry = QueueEntry(
        token_id=new_token.id,
        centre_id=rebalance.new_centre_id,
        queue_position=get_next_queue_position(rebalance.new_centre_id, db),
        entry_status="waiting",
    )
    db.add(queue_entry)
    db.commit()
    
    # Cancel old booking
    old_token = db.query(Token).filter(Token.booking_id == booking.id).first()
    old_queue = db.query(QueueEntry).filter(QueueEntry.token_id == old_token.id).first()
    old_queue.entry_status = "cancelled"
    booking.booking_status = "cancelled"
    db.commit()
    
    # Audit record
    audit = AuditLog(
        user_id=current_user.id,
        action="rebalancing_accepted",
        resource_type="booking",
        resource_id=new_booking.id,
        changes={
            "old_centre": str(rebalance.old_centre_id),
            "new_centre": str(rebalance.new_centre_id),
            "old_wait": rebalance.prediction_before_wait_min,
            "new_wait": rebalance.prediction_after_wait_min,
        }
    )
    db.add(audit)
    db.commit()
    
    return {"status": "accepted", "new_booking_id": str(new_booking.id)}
```

---

## PHASE 7 — DEPLOYMENT & POLISH (Days 22–24)

### 7.1 DOCKER SETUP

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: smartmandi
      POSTGRES_PASSWORD: smartmandi123
      POSTGRES_DB: smartmandi
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://smartmandi:smartmandi123@postgres:5432/smartmandi
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_WS_URL: ws://localhost:8000

volumes:
  postgres_data:
```

### 7.2 ENVIRONMENT VARIABLES TEMPLATE

#### `.env.example`

```
# Database
DATABASE_URL=postgresql://smartmandi:smartmandi123@postgres:5432/smartmandi
REDIS_URL=redis://redis:6379/0

# Authentication
SECRET_KEY=your_super_secret_key_change_this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,https://smartmandi.in

# Logging
LOG_LEVEL=INFO

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_NAME=KISH
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

---

## DEVELOPMENT CHECKLIST

### Phase 1 ✓
- [x] Project structure created
- [x] Database schema designed
- [x] Environment variables template
- [x] Seed data prepared
- [x] Authentication flow implemented

### Phase 2 ✓
- [ ] Farmer login page
- [ ] Farmer dashboard
- [ ] Find centre flow
- [ ] Booking creation
- [ ] Token generation
- [ ] Queue status display

### Phase 3 ✓
- [ ] Authority login
- [ ] Authority dashboard
- [ ] Farmer registry management
- [ ] Queue control interface
- [ ] Equipment status management
- [ ] Procurement form
- [ ] Quality check form

### Phase 4 ✓
- [ ] Admin login
- [ ] Network overview dashboard
- [ ] Centre monitoring
- [ ] Analytics pages
- [ ] Demo simulator

### Phase 5 ✓
- [ ] Arrival prediction model
- [ ] Capacity calculation
- [ ] Wait-time prediction
- [ ] Optimization engine
- [ ] Event processor

### Phase 6 ✓
- [ ] Rebalancing detection
- [ ] Rebalancing offer flow
- [ ] Farmer accept/reject
- [ ] Booking update
- [ ] Audit logging

### Phase 7 ✓
- [ ] Docker setup
- [ ] Environment configuration
- [ ] Testing
- [ ] Performance optimization
- [ ] Responsive UI polish
- [ ] Multilingual support (EN/Tamil/Hindi)
- [ ] Deployment preparation

---

## KEY METRICS TO TRACK

```python
# Performance Indicators
- Average wait time prediction accuracy
- Rebalancing acceptance rate
- Farmer satisfaction (completion rate)
- System optimization quality
- API response times
- WebSocket latency

# Operational Metrics
- Daily farmer count
- Completion rate
- Rejection rate
- Average queue length
- Centre utilization
- Equipment uptime

# Business Metrics
- Procurement volume (tonnes)
- Payment success rate
- No-show rate
- Cost per transaction
```

---

## MVP DEMO FLOW (For Judges)

```
1. Authority logs in
   ↓
2. Authority registers new farmer
   ↓
3. Farmer logs in with Farmer ID
   ↓
4. Farmer enters crop + quantity
   ↓
5. System shows centres + AI recommendation
   ↓
6. Farmer accepts, gets token
   ↓
7. Token appears in authority's queue
   ↓
8. Authority updates weighbridge → FAILED
   ↓
9. System recalculates, finds alternative
   ↓
10. Farmer gets rebalancing notification
    ↓
11. Farmer switches centre
    ↓
12. New token generated
    ↓
13. Admin sees live network map updated
    ↓
14. Admin sees AI insights panel
    ↓
15. Admin runs simulator: "Farmer Surge"
    ↓
16. Live dashboards update in real-time
```

**That is the complete implementation blueprint.**

Will you build Phase 1 now, or do you want me to expand any section?

