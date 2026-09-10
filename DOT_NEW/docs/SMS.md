# SMS

The development provider writes outbound SMS messages to the service log and notification table. It never claims an external delivery.

Inbound requests use `POST /api/v1/webhooks/sms/inbound` with `X-Webhook-Secret`, a provider `message_id`, registered phone number, and message body. Supported commands: `TOKEN`, `QUEUE`, `STATUS`, `PAYMENT`, `HELP`, plus `1 4721` / `2 4721` for a rebalance proposal. Provider IDs make repeated deliveries safe.
