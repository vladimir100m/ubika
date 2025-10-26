# db_clean script

This small README documents the `scripts/db_clean.js` helper.

Purpose
- Safe helper for clearing test/dev fixtures from Postgres and the Mongo read-model.

Usage
- Dry-run (safe):
  - `node scripts/db_clean.js --dry-run`
- Live run (destructive):
  - `node scripts/db_clean.js --confirm`
  - To run only Mongo or Postgres: `--only=mongo` or `--only=pg`
  - Optionally specify Postgres tables: `--tables=table1,table2`

Safety
- The script requires either `--confirm` or the environment variable `SAFE_TO_RUN=true` to perform destructive actions.
- For Mongo, it refuses to run unless `MONGODB_DB` is explicitly set in your environment (or can be parsed from `MONGODB_URI`). This avoids accidentally touching the default `test` DB.
- The script loads `.env.local` if present. Do not commit secrets.

When to use
- Use before/after running fixtures in dev to reset state. Always run `--dry-run` first to inspect planned actions.

Example
- `node scripts/db_clean.js --dry-run --only=mongo`
