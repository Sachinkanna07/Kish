"""Cookie sessions, OTPs and RBAC. Never accept roles from the browser."""
import hashlib, hmac, secrets
from time import time
from fastapi import Request, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from .config import settings
from .db import get_db
from .models import AuthSession, OTP, RateLimit, User, now

passwords = PasswordHasher()

def sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def code_hash(code: str) -> str:
    return hmac.new(settings.secret.encode(), code.encode(), hashlib.sha256).hexdigest()

def check_limit(db: Session, key: str, maximum=5, seconds=600):
    at = now(); record = db.get(RateLimit, key)
    if not record or record.reset_at <= at:
        db.merge(RateLimit(key=key, count=1, reset_at=at + seconds)); return
    if record.count >= maximum:
        raise HTTPException(429, 'Too many attempts. Please wait before trying again.')
    record.count += 1

def create_session(db: Session, user: User):
    raw, refresh, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(40), secrets.token_urlsafe(24)
    session = AuthSession(user_id=user.id, token_hash=sha(raw), csrf=csrf, expires_at=now()+900,
                          refresh_hash=sha(refresh), refresh_expires_at=now()+60*60*24*14)
    db.add(session); db.flush()
    return raw, refresh, csrf

def session_from_request(request: Request, db: Session):
    raw = request.cookies.get('kish_session')
    if not raw: raise HTTPException(401, 'Sign in required.')
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == sha(raw), AuthSession.expires_at > now()))
    if not session: raise HTTPException(401, 'Your session has expired. Please sign in again.')
    user = db.get(User, session.user_id)
    if not user or not user.active: raise HTTPException(401, 'This account is unavailable.')
    return user, session

def current_user(request: Request, db: Session = Depends(get_db)):
    return session_from_request(request, db)[0]

def require(*roles):
    def guard(request: Request, db: Session = Depends(get_db)):
        user, session = session_from_request(request, db)
        if user.role not in roles: raise HTTPException(403, 'You do not have access to this resource.')
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            csrf = request.headers.get('X-CSRF-Token')
            if not csrf or not hmac.compare_digest(csrf, session.csrf):
                raise HTTPException(403, 'Invalid request protection token.')
        return user
    return guard

def issue_otp(db: Session, user: User, code: str):
    db.add(OTP(user_id=user.id, digest=code_hash(code), expires_at=now()+300))

def consume_otp(db: Session, user: User, code: str):
    challenge = db.scalar(select(OTP).where(OTP.user_id == user.id, OTP.used == False, OTP.expires_at > now()).order_by(OTP.created_at.desc()))
    if not challenge or challenge.attempts >= 5 or not hmac.compare_digest(challenge.digest, code_hash(code)):
        if challenge: challenge.attempts += 1
        raise HTTPException(401, 'Invalid or expired verification code.')
    challenge.used = True

def hash_password(value: str): return passwords.hash(value)
def verify_password(value: str, digest: str):
    try: return passwords.verify(digest, value)
    except Exception: return False
