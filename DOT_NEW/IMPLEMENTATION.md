# KISH implementation plan

This file now tracks the corrected product baseline.

## Product definition

KISH is a role-based real-time web platform with three controlled experiences:

- Farmer: pre-registered login, centre recommendation, token, queue, procurement, payment, history
- Authority: farmer registry, live operations, queue control, weighbridge and quality updates, procurement
- Admin: network-level analytics, simulation, optimization, and dynamic rebalancing monitoring

The system uses one shared backend, one PostgreSQL database, Redis/WebSockets for live state, and an optimization-driven intelligence layer.

## Current canonical blueprint

Use [KISH_IMPLEMENTATION_BLUEPRINT.md](../KISH_IMPLEMENTATION_BLUEPRINT.md) as the source of truth for:

1. pages and routes
2. API endpoints
3. WebSocket events
4. database schema
5. prediction and optimization contracts
6. dynamic rebalancing rules
7. simulator requirements
8. development order

## Build order

1. Auth, RBAC, farmers, centres
2. Farmer booking and token flow
3. Authority queue and procurement flow
4. Admin monitoring and analytics
5. Prediction, queue simulation, and capacity snapshots
6. Optimization engine
7. Dynamic rebalancing with audit trail
8. PWA, multilingual UI, and deployment

## Demo slice

The minimum end-to-end demo is:

Authority registers farmer -> Farmer logs in -> Farmer enters crop and quantity -> system recommends a centre -> farmer accepts -> token is generated -> authority sees the queue -> authority marks a weighbridge failed -> effective capacity drops -> wait prediction changes -> optimizer proposes an alternative -> farmer accepts rebalancing -> dashboards update live -> procurement completes -> receipt and payment status are recorded.

## Notes

- No public farmer signup.
- Role selection is backend-driven, not a frontend prompt.
- Simulated data is allowed for the prototype, but must be clearly labeled.
- Production integrations such as government APIs, SMS, and live payment rails remain optional until the core web system is complete.
