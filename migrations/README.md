Migrations folder
=================

This folder contains plain SQL migration files intended for manual review and
execution. Files are named with a date prefix and a short description. The
`scripts/run_migrations.sh` helper can be used to list or apply migrations from
a developer machine or CI runner.

Guidelines
- Keep migrations idempotent when possible (`CREATE TABLE IF NOT EXISTS`)
- Comment rollback steps in each SQL file (see examples in this folder)
- Do not run migrations from serverless functions — use a developer machine or CI

When to run
- Use `./scripts/run_migrations.sh --list` to see pending SQL files
- Use `./scripts/run_migrations.sh --apply` to execute them (requires `psql` and `DATABASE_URL`)
