# Database

Migrations should be generated from the SQLAlchemy metadata before production rollout. Development starts from an idempotent schema initialization and seed function. PostgreSQL is required for production row locks and partial unique indexes; SQLite is a local demonstration fallback.
