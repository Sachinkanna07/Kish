# Kish connected platform architecture

Kish keeps PostgreSQL as the source of truth. Redis is provided for production event distribution and live fan-out; the development implementation uses the same outbox event contract and in-process WebSocket hub.

```mermaid
flowchart LR
  UI[Farmer / Authority / Admin web] --> API[FastAPI API + RBAC]
  SMS[SMS webhook] --> API
  API --> DB[(PostgreSQL)]
  API --> O[Transactional outbox]
  O --> I[Capacity, wait and optimizer]
  I --> R[Rebalance policy]
  R --> N[WebSocket and SMS notification]
  N --> UI
```

The production deployment runs `docker compose up --build`. It uses PostgreSQL, Redis, the API, and the Vite web application.
