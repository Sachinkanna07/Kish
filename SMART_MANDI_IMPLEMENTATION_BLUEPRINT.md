# Smart Mandi Intelligence
## Canonical Implementation Blueprint

This document supersedes the earlier prototype-oriented notes. The product is a **single role-based web platform** with one backend, one database, one realtime layer, and three controlled user experiences:

- Farmer: find the best mandi, get a recommendation, accept a slot, track queue, receive receipt and payment status
- Authority: register farmers, run the centre, update live operations, process procurement, trigger events
- Admin: monitor the whole network, inspect predictions, run analytics, manage simulation, and view rebalancing outcomes

Core principle:

> Do not build a token-booking site. Build a shared real-time procurement intelligence system that predicts, optimizes, rebalances, and audits.

---

## 1. Product Rules

1. One codebase for web, mobile browser, and desktop browser.
2. One shared backend and one shared PostgreSQL database.
3. No public farmer signup. Farmers are pre-registered by Authority.
4. Role is not chosen during normal registration. The backend resolves it from the account record.
5. Authority enters operational reality. Admin observes the whole network. Farmer consumes recommendations.
6. Static queue numbers are not enough. Queue, wait, capacity, and recommendations must update from events.
7. Dynamic rebalancing is a first-class feature, not an animation.
8. All important state changes must be stored as database events and exposed to the UI.
9. Simulated data is allowed for the prototype, but it must be clearly labeled as simulation where applicable.
10. Backend-enforced RBAC is mandatory.

---

## 2. Recommended Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS or design-system CSS tokens
- PWA support for installable mobile behavior
- WebSocket client for live queue and centre state

### Backend
- Python + FastAPI
- Pydantic schemas
- SQLAlchemy or SQLModel
- Alembic migrations
- JWT authentication
- Role-based authorization dependencies

### Data and Realtime
- PostgreSQL for source of truth
- Redis for ephemeral live state, caching, queue counters, event fan-out
- WebSockets for live updates
- Optional background worker for prediction and optimization jobs

### Intelligence
- Arrival prediction: LightGBM, XGBoost, Random Forest, or baseline regression
- Wait prediction: regression or tree-based model
- Capacity estimation: rule-based + model-assisted
- Optimization: OR-Tools
- Simulation: discrete-event simulator / digital twin

---

## 3. Information Architecture

### Public and shared pages
- `/` landing page
- `/login` shared login chooser or universal login entry
- `/onboarding` language and basic intro
- `/not-authorized` authorization error
- `/offline` offline fallback for PWA

### Farmer area
- `/farmer/login`
- `/farmer/dashboard`
- `/farmer/find-centre`
- `/farmer/recommendation/[bookingId]`
- `/farmer/booking/[bookingId]`
- `/farmer/token/[bookingId]`
- `/farmer/queue/[bookingId]`
- `/farmer/procurement/[procurementId]`
- `/farmer/payments`
- `/farmer/history`
- `/farmer/alerts`
- `/farmer/profile`

### Authority area
- `/authority/login`
- `/authority/dashboard`
- `/authority/farmer-registry`
- `/authority/farmers/[farmerId]`
- `/authority/centre/[centreId]`
- `/authority/queue`
- `/authority/weighbridges`
- `/authority/quality`
- `/authority/procurement`
- `/authority/events`
- `/authority/rebalancing`

### Admin area
- `/admin/login`
- `/admin/dashboard`
- `/admin/network-map`
- `/admin/centres`
- `/admin/centres/[centreId]`
- `/admin/analytics/demand`
- `/admin/analytics/capacity`
- `/admin/analytics/queue`
- `/admin/analytics/procurement`
- `/admin/analytics/rebalancing`
- `/admin/simulator`
- `/admin/reports`
- `/admin/audit`

### API and realtime
- `/api/auth/*`
- `/api/farmers/*`
- `/api/authority/*`
- `/api/admin/*`
- `/api/centres/*`
- `/api/bookings/*`
- `/api/queue/*`
- `/api/procurement/*`
- `/api/payments/*`
- `/api/notifications/*`
- `/api/rebalancing/*`
- `/api/simulator/*`
- `/ws` for live updates

---

## 4. Role Model

### Farmer
- Pre-registered by Authority
- Logs in using Farmer ID, email, or phone plus password or OTP
- Can only see own profile, bookings, token, queue, procurement, payments, history, and alerts
- Can accept or reject rebalancing offers for eligible bookings

### Authority
- Assigned to one or more centres or regions
- Can register and verify farmers
- Can manage centre operation status, queue, equipment, staff, weighbridge, quality, and procurement
- Can trigger operational events that feed the intelligence engine

### Admin
- Network-level oversight
- Can see all centres, all predictions, all analytics, simulator controls, and audit logs
- Can inspect rebalancing decisions but should not directly override operational queue processing unless the business rules allow it

### Security rule
- Role is always validated on the backend
- Frontend role hiding is only a convenience layer
- Access control must be enforced by server-side dependencies and database scoping

---

## 5. Route Contracts

### Farmer pages

#### `/farmer/login`
Fields:
- Farmer ID or email or phone
- Password or OTP
- Language selector

Outcome:
- Backend resolves the farmer record
- Session/JWT is created
- Farmer dashboard loads live booking state

#### `/farmer/dashboard`
Cards:
- Recommended centre
- Arrival window
- Predicted wait
- Token status
- Live queue position
- Alerts summary
- Payments summary
- Recent history

#### `/farmer/find-centre`
Inputs:
- Crop
- Expected quantity
- Current location or village
- Optional date/time

Output:
- Nearby centres with distance, queue, capacity, expected wait, congestion, same-day completion probability, and allocation score
- Recommendation card with explanation

#### `/farmer/recommendation/[bookingId]`
Shows:
- Chosen centre
- Alternative centres
- Why the recommendation was chosen
- Arrival window
- Expected wait
- Eligibility and travel tradeoff
- Accept / reject

#### `/farmer/token/[bookingId]`
Shows:
- Token number
- QR code
- Centre
- Arrival window
- Queue position
- Current estimated wait

#### `/farmer/queue/[bookingId]`
Shows:
- Current status
- Farmers ahead
- Service stage
- Live wait estimate
- Updates over WebSocket

#### `/farmer/procurement/[procurementId]`
Shows:
- Gross weight
- Tare weight
- Net weight
- Quality checks
- Acceptance / adjustment / rejection reason
- Final amount

#### `/farmer/payments`
Shows:
- Payment status
- Transaction ID
- Amount
- Timestamp
- Reference receipt

#### `/farmer/history`
Shows:
- Past bookings
- Token history
- Procurement history
- Payment history
- Rebalancing history

#### `/farmer/alerts`
Shows:
- Booking confirmation
- Delay alert
- Rebalancing offer
- Payment update
- Receipt available

#### `/farmer/profile`
Shows:
- Name
- Farmer ID
- Phone
- Email
- Village
- District
- Eligible crops
- Registration source authority

---

### Authority pages

#### `/authority/login`
Fields:
- username or email or phone
- password
- optional 2FA later

#### `/authority/dashboard`
Shows:
- Centre status
- Waiting
- Processing
- Completed
- Expected arrivals
- Live equipment health
- Staff health
- Queue health
- Operational alerts

#### `/authority/farmer-registry`
Actions:
- Add farmer
- Verify farmer
- Search farmer
- Edit farmer
- Deactivate farmer
- View farmer history

Fields:
- Farmer ID
- Name
- Phone
- Email
- Village
- District
- Address
- Eligible crops
- Status

#### `/authority/centre/[centreId]`
Tabs:
- Overview
- Queue
- Weighbridges
- Quality counters
- Staff
- Operational events
- Rebalancing impact

#### `/authority/queue`
Shows:
- Upcoming tokens
- Checked-in farmers
- Processing farmers
- Completed farmers
- Call next action

#### `/authority/weighbridges`
Shows:
- Each weighbridge
- Active / failed / maintenance
- Mark failed
- Mark repaired

#### `/authority/quality`
Shows:
- Moisture
- Foreign matter
- Damaged grain
- Grade
- Accept / adjust / reject
- Mandatory reason for non-acceptance

#### `/authority/procurement`
Shows:
- Farmer token
- Crop
- Quantity
- Gross / tare / net
- Accepted quantity
- Final amount
- Receipt generation

#### `/authority/events`
Shows:
- Queue updates
- Equipment changes
- Staff changes
- No-show events
- Rebalancing triggers
- Audit trail

#### `/authority/rebalancing`
Shows:
- Eligible farmers
- Proposed alternative centre
- Score and reason
- Decision and outcome

---

### Admin pages

#### `/admin/dashboard`
Shows:
- Active centres
- Current queue
- Farmers today
- Processing today
- Avg wait
- Procured today
- Congestion level distribution
- Alerts

#### `/admin/network-map`
Shows:
- All centres with status
- Normal / moderate / congested / critical / offline
- Click-through to centre detail

#### `/admin/centres/[centreId]`
Shows:
- Live operational state
- Capacity snapshot
- Queue snapshot
- Prediction history
- Rebalancing activity
- Failure history

#### `/admin/analytics/*`
Subsections:
- Demand forecast vs actual
- Theoretical vs effective capacity
- Queue growth and completion rate
- Procurement acceptance and rejection
- Centre performance comparison
- Rebalancing frequency and outcome

#### `/admin/simulator`
Controls:
- Normal operation
- Farmer surge
- Weighbridge failure
- Staff shortage
- Processing delay
- Centre closure
- Recovery event

#### `/admin/reports`
- Daily report
- Centre report
- Farmer report
- Procurement report
- Rebalancing report

#### `/admin/audit`
- Who changed what
- When
- Before / after values
- Triggered events
- Optimizer run reference

---

## 6. API Surface

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/otp/request` if OTP mode is enabled
- `POST /api/auth/otp/verify`

### Farmers
- `GET /api/farmers/me`
- `GET /api/farmers/{farmerId}`
- `POST /api/farmers`
- `PATCH /api/farmers/{farmerId}`
- `PATCH /api/farmers/{farmerId}/status`
- `GET /api/farmers/{farmerId}/bookings`
- `GET /api/farmers/{farmerId}/history`

### Centres and capacity
- `GET /api/centres`
- `GET /api/centres/{centreId}`
- `GET /api/centres/{centreId}/live`
- `GET /api/centres/{centreId}/capacity`
- `GET /api/centres/{centreId}/queue`
- `PATCH /api/centres/{centreId}/status`
- `PATCH /api/centres/{centreId}/equipment/{equipmentId}`
- `PATCH /api/centres/{centreId}/staff`

### Booking and token
- `POST /api/bookings/recommend`
- `POST /api/bookings`
- `GET /api/bookings/{bookingId}`
- `PATCH /api/bookings/{bookingId}/cancel`
- `POST /api/bookings/{bookingId}/reassign`
- `GET /api/bookings/{bookingId}/token`
- `POST /api/bookings/{bookingId}/accept-rebalancing`
- `POST /api/bookings/{bookingId}/reject-rebalancing`

### Queue
- `GET /api/queue/{centreId}`
- `POST /api/queue/{centreId}/check-in`
- `POST /api/queue/{centreId}/call-next`
- `PATCH /api/queue/{centreId}/status`
- `GET /api/queue/{bookingId}/position`

### Procurement
- `POST /api/procurement/start`
- `POST /api/procurement/{procurementId}/weighment`
- `POST /api/procurement/{procurementId}/quality-check`
- `POST /api/procurement/{procurementId}/complete`
- `GET /api/procurement/{procurementId}`
- `GET /api/procurement/{procurementId}/receipt`

### Payments
- `POST /api/payments/{procurementId}/create`
- `PATCH /api/payments/{paymentId}/status`
- `GET /api/payments/{paymentId}`
- `GET /api/farmers/{farmerId}/payments`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/{notificationId}/read`
- `POST /api/notifications/send`

### Predictions and analytics
- `POST /api/predictions/arrival`
- `POST /api/predictions/capacity`
- `POST /api/predictions/wait`
- `POST /api/predictions/noshow`
- `GET /api/analytics/overview`
- `GET /api/analytics/demand`
- `GET /api/analytics/capacity`
- `GET /api/analytics/queue`
- `GET /api/analytics/procurement`
- `GET /api/analytics/rebalancing`

### Rebalancing
- `POST /api/rebalancing/evaluate`
- `POST /api/rebalancing/run`
- `GET /api/rebalancing/{rebalancingId}`
- `GET /api/rebalancing/eligible`
- `POST /api/rebalancing/{rebalancingId}/accept`
- `POST /api/rebalancing/{rebalancingId}/reject`

### Simulator
- `POST /api/simulator/reset`
- `POST /api/simulator/farmer-surge`
- `POST /api/simulator/weighbridge-failure`
- `POST /api/simulator/staff-shortage`
- `POST /api/simulator/processing-delay`
- `POST /api/simulator/centre-closure`
- `POST /api/simulator/recovery`

### Audit and reports
- `GET /api/audit`
- `GET /api/reports/daily`
- `GET /api/reports/centre/{centreId}`
- `GET /api/reports/farmer/{farmerId}`
- `GET /api/reports/procurement/{date}`

---

## 7. Realtime WebSocket Events

WebSocket channel: `/ws`

### Client subscriptions
- `subscribe:centre:{centreId}`
- `subscribe:farmer:{farmerId}`
- `subscribe:admin`
- `subscribe:authority:{authorityId}`

### Standard event envelope
```json
{
  "event": "QUEUE_UPDATED",
  "scope": "centre:uuid",
  "timestamp": "2026-09-10T10:30:00Z",
  "data": {}
}
```

### Core events
- `AUTHENTICATED`
- `CENTRE_STATUS_CHANGED`
- `EQUIPMENT_STATUS_CHANGED`
- `STAFF_STATUS_CHANGED`
- `QUEUE_UPDATED`
- `TOKEN_CALLED`
- `FARMER_CHECKED_IN`
- `ARRIVAL_RECORDED`
- `WEIGHMENT_STARTED`
- `WEIGHMENT_COMPLETED`
- `QUALITY_CHECK_COMPLETED`
- `PROCUREMENT_COMPLETED`
- `PAYMENT_STATUS_CHANGED`
- `PREDICTION_UPDATED`
- `OPTIMIZATION_RUN_COMPLETED`
- `REBALANCING_OFFERED`
- `REBALANCING_ACCEPTED`
- `REBALANCING_REJECTED`
- `NOTIFICATION_CREATED`
- `SIMULATION_EVENT_TRIGGERED`
- `ALERT_RAISED`

### Event payload examples

#### Queue update
```json
{
  "event": "QUEUE_UPDATED",
  "scope": "centre:501",
  "data": {
    "centreId": "501",
    "queueLength": 42,
    "currentStage": "QUALITY",
    "farmersAhead": 7,
    "expectedWaitMinutes": 24
  }
}
```

#### Rebalancing offer
```json
{
  "event": "REBALANCING_OFFERED",
  "scope": "farmer:701",
  "data": {
    "rebalancingId": "RB-2026-0012",
    "bookingId": "BK-2026-0042",
    "oldCentre": { "id": "502", "name": "Mandi B" },
    "newCentre": { "id": "503", "name": "Mandi C" },
    "predictionBeforeWaitMin": 91,
    "predictionAfterWaitMin": 28,
    "reason": "Weighbridge failure reduced effective capacity"
  }
}
```

---

## 8. Database Blueprint

### 8.1 Core auth and identity

#### `roles`
- `id`
- `name` (`farmer`, `authority`, `admin`)
- `description`
- `created_at`

#### `users`
- `id`
- `full_name`
- `email`
- `phone`
- `password_hash`
- `role_id`
- `is_active`
- `last_login_at`
- `created_at`
- `updated_at`

#### `auth_sessions` or `refresh_tokens`
- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `created_at`

### 8.2 Farmer registry

#### `farmers`
- `id`
- `user_id`
- `farmer_id`
- `name`
- `phone`
- `email`
- `village`
- `district`
- `address`
- `status`
- `registered_by_authority_id`
- `verified_at`
- `created_at`
- `updated_at`

#### `farmer_eligible_crops`
- `id`
- `farmer_id`
- `crop_id`
- `is_active`
- `created_at`

### 8.3 Authority and centre network

#### `authorities`
- `id`
- `user_id`
- `name`
- `region`
- `phone`
- `email`
- `created_at`

#### `centres`
- `id`
- `authority_id`
- `name`
- `code`
- `location_lat`
- `location_lng`
- `address`
- `base_capacity_per_hour`
- `operating_hours_start`
- `operating_hours_end`
- `status`
- `created_at`
- `updated_at`

#### `centre_equipment`
- `id`
- `centre_id`
- `equipment_type`
- `equipment_number`
- `status`
- `last_maintenance_at`
- `updated_at`

#### `centre_staff`
- `id`
- `centre_id`
- `total_staff`
- `active_staff`
- `shift_label`
- `updated_at`

#### `crops`
- `id`
- `crop_code`
- `name`
- `seasonal_tag`
- `created_at`

#### `market_rates`
- `id`
- `centre_id`
- `crop_id`
- `rate_per_quintal`
- `updated_at`

### 8.4 Bookings and queue

#### `slots`
- `id`
- `centre_id`
- `slot_date`
- `slot_time_start`
- `slot_time_end`
- `max_allocations`
- `current_allocations`
- `created_at`

#### `bookings`
- `id`
- `booking_id`
- `farmer_id`
- `centre_id`
- `crop_id`
- `expected_quantity_kg`
- `arrival_window_start`
- `arrival_window_end`
- `slot_id`
- `token_id`
- `status`
- `allocation_score`
- `model_version`
- `optimizer_run_id`
- `created_at`
- `updated_at`

#### `tokens`
- `id`
- `token_number`
- `booking_id`
- `centre_id`
- `qr_code_data`
- `status`
- `created_at`
- `updated_at`

#### `queue_entries`
- `id`
- `token_id`
- `centre_id`
- `queue_position`
- `check_in_time`
- `start_processing_time`
- `completion_time`
- `status`
- `created_at`
- `updated_at`

### 8.5 Operations and procurement

#### `operational_events`
- `id`
- `event_type`
- `centre_id`
- `user_id`
- `event_data` JSONB
- `created_at`

#### `procurements`
- `id`
- `procurement_id`
- `token_id`
- `farmer_id`
- `centre_id`
- `crop_id`
- `expected_quantity_kg`
- `gross_weight_kg`
- `tare_weight_kg`
- `net_weight_kg`
- `accepted_quantity_kg`
- `quality_moisture`
- `quality_foreign_matter`
- `quality_damaged_grain`
- `quality_grade`
- `status`
- `rejection_reason`
- `adjustment_reason`
- `rate_per_quintal`
- `total_amount`
- `authority_user_id`
- `created_at`
- `updated_at`

#### `receipts`
- `id`
- `receipt_id`
- `procurement_id`
- `pdf_url`
- `qr_verification_code`
- `created_at`

#### `payments`
- `id`
- `payment_id`
- `procurement_id`
- `farmer_id`
- `amount`
- `payment_status`
- `transaction_id`
- `transaction_timestamp`
- `payment_method`
- `created_at`
- `updated_at`

### 8.6 Intelligence and audit

#### `predictions`
- `id`
- `prediction_type` (`arrival`, `capacity`, `waittime`, `noshow`)
- `centre_id`
- `prediction_timestamp`
- `input_features` JSONB
- `predicted_value`
- `confidence`
- `model_version`
- `created_at`

#### `centre_capacity_snapshots`
- `id`
- `centre_id`
- `snapshot_time`
- `base_capacity_per_hour`
- `equipment_availability`
- `staff_availability`
- `quality_counter_availability`
- `operational_efficiency`
- `effective_capacity_per_hour`
- `created_at`

#### `queue_snapshots`
- `id`
- `centre_id`
- `snapshot_time`
- `queue_length`
- `expected_wait_minutes`
- `congestion_level`
- `current_processing_rate`
- `created_at`

#### `optimization_runs`
- `id`
- `run_type` (`initial_allocation`, `rebalancing`, `simulation`)
- `run_timestamp`
- `run_duration_ms`
- `input_farmer_count`
- `input_centre_count`
- `objective_value`
- `constraints_satisfied`
- `recommendations_count`
- `recommendations_accepted`
- `status`
- `created_at`

#### `rebalancing_events`
- `id`
- `rebalancing_id`
- `trigger_event_id`
- `trigger_reason`
- `affected_farmer_id`
- `old_centre_id`
- `old_arrival_window_start`
- `old_arrival_window_end`
- `new_centre_id`
- `new_arrival_window_start`
- `new_arrival_window_end`
- `prediction_before_wait_min`
- `prediction_after_wait_min`
- `prediction_before_capacity`
- `prediction_after_capacity`
- `optimizer_score`
- `status`
- `farmer_decision`
- `farmer_decision_time`
- `created_at`
- `updated_at`

#### `notifications`
- `id`
- `user_id`
- `notification_type`
- `title`
- `message`
- `related_booking_id`
- `related_rebalancing_id`
- `is_read`
- `read_at`
- `created_at`

#### `audit_logs`
- `id`
- `user_id`
- `action`
- `resource_type`
- `resource_id`
- `changes` JSONB
- `created_at`

---

## 9. AI Data Structures

### 9.1 Feature payloads

#### Arrival prediction input
```json
{
  "centreId": "uuid",
  "cropId": "uuid",
  "expectedQuantityKg": 8000,
  "date": "2026-09-10",
  "timeBucket": "10:00-11:00",
  "historicalArrivals": 124,
  "recentArrivalRate": 18.5,
  "queueLength": 42,
  "currentCapacity": 52,
  "equipmentAvailability": 0.67,
  "staffAvailability": 0.8,
  "weatherRisk": 0.2,
  "noShowRate": 0.07
}
```

#### Wait prediction input
```json
{
  "queueLength": 42,
  "effectiveCapacityPerHour": 10.9,
  "availableWeighbridges": 2,
  "availableQualityCounters": 3,
  "staffAvailable": 8,
  "arrivalRate": 15.2,
  "processingStageMix": {
    "waiting": 30,
    "weighing": 7,
    "quality": 5
  }
}
```

### 9.2 Prediction outputs

#### Arrival prediction response
```json
{
  "predictionType": "arrival",
  "centreId": "uuid",
  "predictedArrivals": 81,
  "confidence": 0.84,
  "modelVersion": "arrival-v1",
  "featuresUsed": ["historicalArrivals", "recentArrivalRate", "cropId"]
}
```

#### Wait prediction response
```json
{
  "predictionType": "waittime",
  "centreId": "uuid",
  "expectedWaitMinutes": 27,
  "confidence": 0.79,
  "modelVersion": "wait-v1"
}
```

### 9.3 Optimization request
```json
{
  "bookingId": "uuid",
  "farmerId": "uuid",
  "cropId": "uuid",
  "expectedQuantityKg": 8000,
  "candidateCentres": ["uuid", "uuid", "uuid"],
  "objectiveWeights": {
    "waitTime": 0.4,
    "travelCost": 0.2,
    "congestion": 0.2,
    "sameDayCompletion": 0.2
  },
  "constraints": {
    "maxTravelKm": 30,
    "operatingHoursOnly": true,
    "farmerEligibilityOnly": true,
    "lockCheckedInFarmers": true
  }
}
```

### 9.4 Optimization response
```json
{
  "runId": "uuid",
  "recommendations": [
    {
      "centreId": "uuid",
      "score": 94.2,
      "arrivalWindowStart": "2026-09-10T10:40:00Z",
      "arrivalWindowEnd": "2026-09-10T11:00:00Z",
      "expectedWaitMinutes": 25,
      "sameDayCompletionProbability": 0.94,
      "reasons": ["low congestion", "higher effective capacity"]
    }
  ]
}
```

### 9.5 Rebalancing offer payload
```json
{
  "rebalancingId": "uuid",
  "bookingId": "uuid",
  "triggerEventId": "uuid",
  "reason": "Weighbridge failure reduced effective capacity",
  "oldCentre": {
    "id": "uuid",
    "waitMinutes": 91,
    "capacity": 0.52
  },
  "newCentre": {
    "id": "uuid",
    "waitMinutes": 28,
    "capacity": 0.83
  },
  "eligibility": {
    "locked": false,
    "farmerIsUpcoming": true,
    "alreadyCheckedIn": false
  }
}
```

---

## 10. Dynamic Rebalancing Rules

### Locked bookings
Never move:
- Already processing
- Already checked in
- Weighment in progress
- Quality check in progress

### Usually stable
Usually keep:
- Farmers physically near the centre
- Farmers with minimal remaining wait
- Farmers whose travel time increase is too high

### Eligible for rebalancing
Prioritize:
- Upcoming farmers
- Future bookings
- Unchecked-in tokens
- Bookings with strong wait reduction at alternate centres

### Trigger conditions
A rebalancing run should execute when any of these change materially:
- Weighbridge status changes
- Staff count drops or rises
- Centre closes or reopens
- Queue spikes
- Effective capacity falls below threshold
- Wait prediction crosses threshold
- Simulated failure injected by admin

### Objective function
Minimize:
- wait time
- travel cost
- congestion
- overload risk
- missed-slot risk

Maximize:
- same-day completion probability
- successful procurement throughput
- centre utilization
- farmer acceptance probability

### Output rules
- Do not reassign everyone blindly
- Re-optimize only eligible future work
- Preserve audit trail for every move
- Store old and new predictions for comparison
- Record farmer decision separately from optimizer recommendation

---

## 11. Effective Capacity Model

Recommended formula:

```text
Effective Capacity = Base Capacity
                    x Equipment Availability
                    x Staff Availability
                    x Quality Counter Availability
                    x Operational Efficiency
```

Example:
- Base capacity: 30 farmers/hour
- Equipment availability: 0.67
- Staff availability: 0.80
- Quality counter availability: 0.75
- Efficiency: 0.90

Result:
- Effective capacity: about 10.9 farmers/hour

This value should be snapshot-driven and used by wait prediction and optimization, not just displayed as a static number.

---

## 12. Simulator / Digital Twin

The simulator should be able to create synthetic centre states and event streams for demo use.

### Simulated entities
- Centres with different capacity profiles
- Farmers with expected arrival patterns
- Queue arrivals
- Service times
- Equipment failures
- Staff shortage
- No-shows
- Reopening after failure

### Simulation controls
- Normal operation
- Farmer surge
- Weighbridge failure
- Staff shortage
- Processing delay
- Centre closure
- Recovery

### Simulation output
- Updates to operational events
- New predictions
- Queue changes
- Rebalancing offer generation
- Admin analytics refresh

The simulator must label its data as synthetic where appropriate.

---

## 13. Frontend Folder Structure

```text
frontend/
  app/
    (auth)/
    farmer/
    authority/
    admin/
    api/
    layout.tsx
    globals.css
  components/
    common/
    farmer/
    authority/
    admin/
    ui/
  features/
    auth/
    booking/
    queue/
    procurement/
    rebalancing/
    analytics/
  hooks/
  lib/
    api.ts
    auth.ts
    websocket.ts
    rbac.ts
    format.ts
  types/
  middleware.ts
  public/
  tests/
```

---

## 14. Backend Folder Structure

```text
backend/
  app/
    main.py
    config.py
    auth/
    farmers/
    authority/
    admin/
    centres/
    bookings/
    queue/
    procurement/
    payments/
    notifications/
    analytics/
    events/
    rebalancing/
    simulator/
    common/
    db/
    services/
    workers/
  alembic/
  tests/
```

### Module responsibilities
- `auth`: login, session, refresh, RBAC
- `farmers`: registry, profile, farmer history
- `authority`: centre operations, registry, procurement, quality
- `admin`: analytics, monitoring, audit, reports
- `centres`: centre metadata and live state
- `bookings`: recommendation, booking, token creation
- `queue`: queue state and position changes
- `procurement`: weighment, quality, acceptance, receipt
- `payments`: payment status representation
- `notifications`: alerts and message delivery
- `analytics`: aggregates, dashboards, KPIs
- `events`: event processor and state fan-out
- `rebalancing`: eligible set evaluation and allocation changes
- `simulator`: synthetic event generation

---

## 15. Environment Variables

### Frontend
```env
NEXT_PUBLIC_APP_NAME=Smart Mandi Intelligence
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ta,hi
```

### Backend
```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/smart_mandi
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change-me
JWT_ACCESS_TTL_MINUTES=30
JWT_REFRESH_TTL_DAYS=7
CORS_ORIGINS=http://localhost:3000,https://smartmandi.in
LOG_LEVEL=INFO
MODEL_ARTIFACT_DIR=./artifacts
SIMULATION_MODE=true
```

### Optional production integrations
```env
SMS_PROVIDER=
SMS_API_KEY=
EMAIL_PROVIDER=
OBJECT_STORAGE_URL=
```

If these are empty, the core web product should still run using simulated notifications.

---

## 16. Seed Data Plan

Seed at minimum:
- 3 roles
- 1 admin user
- 1 or 2 authority users
- 3 centres
- 3 to 5 weighbridges per centre
- 3 to 5 quality counters per centre
- 8 to 12 farmers
- 4 crops
- sample market rates
- sample operational events
- sample bookings
- sample queue entries
- sample procurement records
- sample notifications
- sample predictions

### Demo-ready seed characteristics
- One centre should become congested during demo
- One weighbridge failure event should create a visible rebalancing opportunity
- One farmer should be eligible for an alternate centre
- One booking should be locked so the rebalancer cannot move it
- One booking should be upcoming so it can move

---

## 17. Development Order

### Phase 1: Foundation
- Project setup
- Database schema and migrations
- Authentication
- RBAC
- Farmer registry
- Centre registry

### Phase 2: Farmer
- Farmer login
- Dashboard
- Centre discovery
- Crop + quantity intake
- Recommendation comparison
- Booking
- Token display
- Live queue

### Phase 3: Authority
- Authority login
- Centre dashboard
- Farmer registry
- Queue control
- Weighbridge status
- Staff status
- Procurement
- Quality check

### Phase 4: Admin
- Admin login
- Network overview
- Centre monitoring
- Analytics
- Reports
- Simulator controls

### Phase 5: Intelligence
- Synthetic dataset
- Arrival model
- Capacity model
- Wait-time model
- Congestion model
- Optimization engine

### Phase 6: Dynamic Rebalancing
- Operational event triggers
- Recompute effective capacity
- Recompute wait
- Run optimizer again
- Filter eligible farmers
- Create alternative allocation
- Notify farmer
- Save decision and audit

### Phase 7: Polish
- Responsive layout
- Tamil / Hindi / English support
- PWA installability
- PDF receipt
- Notifications
- Error handling
- Test coverage
- Deployment

---

## 18. MVP Demo Slice

The minimum end-to-end demo should be:

1. Authority registers a farmer.
2. Farmer logs in using Farmer ID, email, or phone.
3. Farmer enters crop and expected quantity.
4. System compares nearby centres.
5. AI recommends centre, slot, and arrival window.
6. Farmer accepts the recommendation.
7. Token is generated.
8. Authority sees the booking and live queue.
9. Authority marks a weighbridge as failed.
10. Effective capacity is recalculated.
11. Wait prediction changes.
12. Optimizer identifies a better centre.
13. Farmer receives a rebalancing recommendation.
14. Farmer accepts the switch.
15. Allocation changes in the database.
16. Authority and admin dashboards update live.
17. Procurement is completed.
18. Quality check is recorded.
19. Receipt is generated.
20. Payment status and history are updated.

If this chain works, the project works.

---

## 19. What Must Never Happen

- Public farmer signup
- Separate databases for each role
- Frontend-only role checks
- Fake chatbot standing in for intelligence
- Static queue values masquerading as live state
- Hard-coded recommendation that never changes
- Rebalancing animation without database effects
- Analytics page without operational meaning
- Payment transfer claims without actual payment integration

---

## 20. Build Hand-off Summary

Implement the project in this order:

1. Auth, RBAC, farmers, centres
2. Farmer booking and token flow
3. Authority queue and procurement flow
4. Admin monitoring and analytics
5. Prediction, queue simulation, and capacity snapshots
6. Optimization engine
7. Dynamic rebalancing with auditability
8. PWA, multilingual UI, and deployment

This is the actual product definition:

> Smart Mandi Intelligence is a role-based real-time web platform that connects pre-registered farmers, mandi authorities, and administrators through a shared procurement system, using demand prediction, effective-capacity estimation, queue intelligence, optimization, and dynamic rebalancing to continuously adapt farmer allocations to changing mandi conditions.
