"""Relational source of truth. Quantities are tonnes; rates are INR/tonne."""
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import String, Float, Integer, Boolean, JSON, ForeignKey, UniqueConstraint, CheckConstraint, Index, text
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

def now():
    return datetime.now(timezone.utc).timestamp()

class Row:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[float] = mapped_column(Float, default=now, index=True)

class User(Row, Base):
    __tablename__ = 'users'
    login: Mapped[str] = mapped_column(String(160), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20))
    password: Mapped[str] = mapped_column(String(256), default='')
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    __table_args__ = (CheckConstraint("role IN ('FARMER','AUTHORITY','ADMIN')"),)

class Farmer(Row, Base):
    __tablename__ = 'farmers'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), unique=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    phone: Mapped[str] = mapped_column(String(16), unique=True)
    email: Mapped[str | None] = mapped_column(String(160), unique=True)
    village: Mapped[str] = mapped_column(String(120))
    district: Mapped[str] = mapped_column(String(120), default='Thanjavur')
    region: Mapped[str] = mapped_column(String(120), default='Delta')
    address: Mapped[str] = mapped_column(String(500), default='')
    reference: Mapped[str] = mapped_column(String(120), default='')
    notes: Mapped[str] = mapped_column(String(1000), default='')
    crops: Mapped[list] = mapped_column(JSON, default=lambda: ['paddy'])
    lat: Mapped[float] = mapped_column(Float, default=10.79)
    lon: Mapped[float] = mapped_column(Float, default=79.14)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE')
    registered_by: Mapped[str] = mapped_column(ForeignKey('users.id'))
    verified_at: Mapped[float | None] = mapped_column(Float)
    updated_at: Mapped[float] = mapped_column(Float, default=now, onupdate=now)

class Assignment(Row, Base):
    __tablename__ = 'authority_centre_assignments'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'))
    __table_args__ = (UniqueConstraint('user_id', 'centre_id'),)

class AuthSession(Row, Base):
    __tablename__ = 'sessions'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    csrf: Mapped[str] = mapped_column(String(100))
    expires_at: Mapped[float] = mapped_column(Float)
    refresh_hash: Mapped[str] = mapped_column(String(64), unique=True)
    refresh_expires_at: Mapped[float] = mapped_column(Float)

class OTP(Row, Base):
    __tablename__ = 'otp_challenges'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    digest: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[float] = mapped_column(Float)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    used: Mapped[bool] = mapped_column(Boolean, default=False)

class RateLimit(Base):
    __tablename__ = 'rate_limits'
    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)
    reset_at: Mapped[float] = mapped_column(Float)

class Crop(Row, Base):
    __tablename__ = 'crops'
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    rate: Mapped[float] = mapped_column(Float)

class Centre(Row, Base):
    __tablename__ = 'centres'
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    village: Mapped[str] = mapped_column(String(120))
    district: Mapped[str] = mapped_column(String(120), default='Thanjavur')
    region: Mapped[str] = mapped_column(String(120), default='Delta')
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default='OPEN')
    crops: Mapped[list] = mapped_column(JSON, default=lambda: ['paddy', 'maize'])
    base_capacity: Mapped[float] = mapped_column(Float, default=24)
    quantity_capacity: Mapped[float] = mapped_column(Float, default=200)
    staff_active: Mapped[int] = mapped_column(Integer, default=8)
    staff_planned: Mapped[int] = mapped_column(Integer, default=8)
    efficiency: Mapped[float] = mapped_column(Float, default=.9)
    open_hour: Mapped[int] = mapped_column(Integer, default=8)
    close_hour: Mapped[int] = mapped_column(Integer, default=18)
    version: Mapped[int] = mapped_column(Integer, default=1)
    __table_args__ = (CheckConstraint('staff_active >= 0 AND staff_planned > 0'),)

class Resource(Row, Base):
    __tablename__ = 'resources'
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'), index=True)
    code: Mapped[str] = mapped_column(String(30))
    kind: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default='ACTIVE')
    rate: Mapped[float] = mapped_column(Float, default=12)
    notes: Mapped[str] = mapped_column(String(500), default='')
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[float] = mapped_column(Float, default=now)
    __table_args__ = (UniqueConstraint('centre_id', 'code'),)

class Slot(Row, Base):
    __tablename__ = 'slots'
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'), index=True)
    start: Mapped[float] = mapped_column(Float)
    end: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer, default=12)
    quantity_capacity: Mapped[float] = mapped_column(Float, default=50)
    __table_args__ = (UniqueConstraint('centre_id', 'start'), CheckConstraint('end > start AND capacity > 0'))

ACTIVE = ['CONFIRMED', 'REBALANCE_PENDING', 'ARRIVING', 'CHECKED_IN', 'WEIGHING', 'QUALITY']
class Booking(Row, Base):
    __tablename__ = 'bookings'
    farmer_id: Mapped[str] = mapped_column(ForeignKey('farmers.id'), index=True)
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'), index=True)
    crop_id: Mapped[str] = mapped_column(ForeignKey('crops.id'))
    slot_id: Mapped[str] = mapped_column(ForeignKey('slots.id'))
    quantity: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default='CONFIRMED', index=True)
    token: Mapped[str] = mapped_column(String(30), unique=True)
    optimizer_id: Mapped[str | None] = mapped_column(ForeignKey('optimization_runs.id'))
    checked_in_at: Mapped[float | None] = mapped_column(Float)
    verified_by: Mapped[str | None] = mapped_column(ForeignKey('users.id'))
    verified_at: Mapped[float | None] = mapped_column(Float)
    completed_at: Mapped[float | None] = mapped_column(Float)
    reassigned_at: Mapped[float | None] = mapped_column(Float)
    updated_at: Mapped[float] = mapped_column(Float, default=now, onupdate=now)
    __table_args__ = (CheckConstraint('quantity > 0'), Index('one_active_booking', 'farmer_id', unique=True,
        postgresql_where=text("status IN ('CONFIRMED','REBALANCE_PENDING','ARRIVING','CHECKED_IN','WEIGHING','QUALITY')"),
        sqlite_where=text("status IN ('CONFIRMED','REBALANCE_PENDING','ARRIVING','CHECKED_IN','WEIGHING','QUALITY')")))

class Snapshot(Row, Base):
    __tablename__ = 'predictions'
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'), index=True)
    model_version: Mapped[str] = mapped_column(String(80), default='deterministic-v1')
    data: Mapped[dict] = mapped_column(JSON)

class Optimization(Row, Base):
    __tablename__ = 'optimization_runs'
    farmer_id: Mapped[str] = mapped_column(ForeignKey('farmers.id'), index=True)
    candidates: Mapped[list] = mapped_column(JSON)
    selected: Mapped[str | None] = mapped_column(String(36))
    solver: Mapped[str] = mapped_column(String(60), default='OR-Tools CP-SAT')
    constraints: Mapped[list] = mapped_column(JSON)

class Proposal(Row, Base):
    __tablename__ = 'rebalancing_events'
    booking_id: Mapped[str] = mapped_column(ForeignKey('bookings.id'), index=True)
    old_centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'))
    new_centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'))
    new_slot_id: Mapped[str] = mapped_column(ForeignKey('slots.id'))
    optimizer_id: Mapped[str] = mapped_column(ForeignKey('optimization_runs.id'))
    trigger_event_id: Mapped[str] = mapped_column(String(36))
    evidence: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default='PROPOSED', index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[float] = mapped_column(Float)
    decided_at: Mapped[float | None] = mapped_column(Float)
    channel: Mapped[str | None] = mapped_column(String(20))
    __table_args__ = (Index('one_open_proposal', 'booking_id', unique=True,
        postgresql_where=text("status = 'PROPOSED'"), sqlite_where=text("status = 'PROPOSED'")),)

class Weighment(Row, Base):
    __tablename__ = 'weighments'
    booking_id: Mapped[str] = mapped_column(ForeignKey('bookings.id'), unique=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey('resources.id'))
    operator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    gross: Mapped[float] = mapped_column(Float)
    tare: Mapped[float] = mapped_column(Float)
    net: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(30), default='VERIFIED_MANUAL')
    __table_args__ = (CheckConstraint('gross > tare AND tare >= 0 AND net > 0'),)

class Quality(Row, Base):
    __tablename__ = 'quality_checks'
    booking_id: Mapped[str] = mapped_column(ForeignKey('bookings.id'), unique=True)
    operator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    moisture: Mapped[float] = mapped_column(Float)
    foreign_matter: Mapped[float] = mapped_column(Float)
    damaged: Mapped[float] = mapped_column(Float)
    grade: Mapped[str] = mapped_column(String(10))
    decision: Mapped[str] = mapped_column(String(10))
    reason: Mapped[str] = mapped_column(String(500), default='')

class Procurement(Row, Base):
    __tablename__ = 'procurements'
    booking_id: Mapped[str] = mapped_column(ForeignKey('bookings.id'), unique=True)
    operator_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    accepted: Mapped[float] = mapped_column(Float)
    rate: Mapped[float] = mapped_column(Float)
    amount: Mapped[float] = mapped_column(Float)
    snapshot: Mapped[dict] = mapped_column(JSON)
    __table_args__ = (CheckConstraint('accepted >= 0 AND amount >= 0'),)

class Payment(Row, Base):
    __tablename__ = 'payments'
    procurement_id: Mapped[str] = mapped_column(ForeignKey('procurements.id'), unique=True)
    status: Mapped[str] = mapped_column(String(20), default='PENDING', index=True)
    amount: Mapped[float] = mapped_column(Float)
    reference: Mapped[str | None] = mapped_column(String(100), unique=True)
    simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[float] = mapped_column(Float, default=now)

class Event(Row, Base):
    __tablename__ = 'outbox_events'
    type: Mapped[str] = mapped_column(String(60), index=True)
    centre_id: Mapped[str | None] = mapped_column(ForeignKey('centres.id'))
    farmer_id: Mapped[str | None] = mapped_column(ForeignKey('farmers.id'))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    correlation_id: Mapped[str] = mapped_column(String(36))
    causation_id: Mapped[str | None] = mapped_column(String(36))
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    simulation_id: Mapped[str | None] = mapped_column(ForeignKey('simulation_runs.id'))

class Audit(Row, Base):
    __tablename__ = 'audit_logs'
    actor_id: Mapped[str | None] = mapped_column(ForeignKey('users.id'))
    action: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(36))
    before: Mapped[dict] = mapped_column(JSON, default=dict)
    after: Mapped[dict] = mapped_column(JSON, default=dict)
    correlation_id: Mapped[str] = mapped_column(String(36))

class Notification(Row, Base):
    __tablename__ = 'notifications'
    farmer_id: Mapped[str] = mapped_column(ForeignKey('farmers.id'), index=True)
    type: Mapped[str] = mapped_column(String(60))
    body: Mapped[str] = mapped_column(String(2000))
    status: Mapped[str] = mapped_column(String(20), default='QUEUED')
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt: Mapped[float] = mapped_column(Float, default=now)
    provider_id: Mapped[str | None] = mapped_column(String(120), unique=True)
    last_error: Mapped[str | None] = mapped_column(String(300))

class Idempotency(Row, Base):
    __tablename__ = 'idempotency_keys'
    key: Mapped[str] = mapped_column(String(200), unique=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    result: Mapped[dict] = mapped_column(JSON)

class History(Row, Base):
    __tablename__ = 'arrival_service_history'
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'), index=True)
    hour: Mapped[int] = mapped_column(Integer)
    arrivals: Mapped[int] = mapped_column(Integer)
    service_minutes: Mapped[float] = mapped_column(Float)
    no_shows: Mapped[int] = mapped_column(Integer, default=0)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

class Simulation(Row, Base):
    __tablename__ = 'simulation_runs'
    scenario: Mapped[str] = mapped_column(String(60))
    centre_id: Mapped[str] = mapped_column(ForeignKey('centres.id'))
    actor_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    result: Mapped[dict] = mapped_column(JSON, default=dict)
