"""Provider seams: replace development adapters via environment configuration."""
from abc import ABC, abstractmethod
from uuid import uuid4

class SMSProvider(ABC):
    @abstractmethod
    def send(self, phone: str, body: str) -> str: ...

class DevelopmentSMSProvider(SMSProvider):
    def send(self, phone: str, body: str) -> str:
        print({'integration': 'DEVELOPMENT_SMS_ONLY', 'phone': phone, 'body': body})
        return f'dev-sms-{uuid4()}'

class PaymentProvider(ABC):
    @abstractmethod
    def initiate(self, amount: float, reference: str) -> dict: ...

class SimulatedPaymentProvider(PaymentProvider):
    def initiate(self, amount, reference): return {'status': 'PENDING', 'reference': reference, 'simulated': True}

sms_provider: SMSProvider = DevelopmentSMSProvider()
payment_provider: PaymentProvider = SimulatedPaymentProvider()
