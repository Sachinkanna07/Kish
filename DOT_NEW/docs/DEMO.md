# Primary demo

1. Sign in to the authority API as `authority@kish.local` / `Authority@123`.
2. Create Ravi with `FM-10284`, phone `9876543210`, and crop `paddy`.
3. Request his OTP and verify `123456` in development.
4. Ask for paddy recommendations, then make a booking with an `Idempotency-Key` header.
5. In the authority portal, mark an active weighbridge at the selected centre `FAILED`.
6. The API recalculates capacity and, when the policy threshold is met, creates an SMS/WebSocket proposal.
7. Accept it using the web route or SMS `1 CODE`.
8. Check in, record weighment, record quality, complete procurement, then open the receipt PDF.

The seeded admin account is `admin@kish.local` / `Admin@123`. These accounts are development-only.
