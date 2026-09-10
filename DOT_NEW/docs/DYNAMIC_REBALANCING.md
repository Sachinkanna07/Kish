# Dynamic rebalancing

```mermaid
sequenceDiagram
  participant A as Authority
  participant K as Kish API
  participant O as Optimizer
  participant F as Farmer
  A->>K: Mark weighbridge failed
  K->>K: Write resource, audit, and outbox event
  K->>O: Recalculate capacity and wait
  O->>K: Eligible alternative and evidence
  K->>F: WebSocket + SMS proposal
  F->>K: Accept by web or SMS code
  K->>K: Lock and atomically switch booking
  K->>F: Confirm the new allocation
```

Only `CONFIRMED` and `REBALANCE_PENDING` bookings are eligible. The policy requires a configured time saving, an open alternative with a safe slot, and allowable extra travel. Accepted switches have a cooldown. Repeated SMS webhooks are idempotent.
