# Authorization

Roles are stored server-side: `FARMER`, `AUTHORITY`, and `ADMIN`. There is no role selector or farmer self-registration endpoint.

- Farmers authenticate with a one-time code matched to an active authority-created account.
- Authorities authenticate with password hashes and may operate only assigned centres.
- Admins have network scope.
- All state-changing API calls require an HttpOnly session cookie and a matching CSRF header.
- OTPs are HMAC digests, expire after five minutes, are single-use, and are rate limited.

The API returns 403 for a valid account whose role or centre scope is insufficient.
