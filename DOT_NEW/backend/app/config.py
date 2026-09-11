import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

def database_url_from_environment() -> str:
    database_url = os.getenv('DATABASE_URL', 'sqlite:///./kish.db')
    if database_url.startswith('postgresql://'):
        return database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    if database_url.startswith('postgres://'):
        return database_url.replace('postgres://', 'postgresql+psycopg://', 1)
    return database_url

@dataclass(frozen=True)
class Settings:
    database_url: str = database_url_from_environment()
    redis_url: str = os.getenv('REDIS_URL', '')
    secret: str = os.getenv('AUTH_SECRET', 'development-only-replace-before-deploying')
    production: bool = os.getenv('APP_ENV', 'development') == 'production'
    simulation: bool = os.getenv('SIMULATION_MODE', 'true').lower() == 'true'
    origins: tuple = tuple(os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173,http://localhost:8080').split(','))
    sms_secret: str = os.getenv('SMS_WEBHOOK_SECRET', 'local-webhook-secret')
    min_saving: float = float(os.getenv('REBALANCE_MIN_SAVING', '20'))
    max_extra_km: float = float(os.getenv('REBALANCE_MAX_EXTRA_KM', '20'))
    cooldown_minutes: int = int(os.getenv('REBALANCE_COOLDOWN_MINUTES', '120'))
    proposal_minutes: int = int(os.getenv('REBALANCE_EXPIRY_MINUTES', '15'))
    capacity_buffer: float = float(os.getenv('REBALANCE_CAPACITY_BUFFER', '0.1'))

settings = Settings()
if settings.production and (settings.database_url.startswith('sqlite') or len(settings.secret) < 32 or settings.secret.startswith('development') or settings.sms_secret == 'local-webhook-secret' or settings.simulation):
    raise RuntimeError('Production requires PostgreSQL, strong AUTH_SECRET, SMS_WEBHOOK_SECRET and SIMULATION_MODE=false')
