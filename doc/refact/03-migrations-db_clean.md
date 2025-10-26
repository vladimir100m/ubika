# Step 03 — Migrations & db_clean

Purpose
- Provide reversible migrations for Postgres artifacts and a safe `db_clean` script that supports Postgres and Mongo collections for test and dev cleanups.

Actions
1. Add SQL migration file `migrations/2025-10-26-create_property_documents.sql` (create table or leave for Postgres read-model if desired). Include rollback SQL.
2. Write `scripts/db_clean.js` that accepts flags:
   - --pg-tables=table1,table2
   - --mongo-collections=col1,col2
   - --confirm (required)
   - Require env SAFE_TO_RUN=1 to actually run truncations/deletions.
3. Add `migrations/README.md` describing how to run and rollback.

Commands (examples)
```bash
# run SQL migration (example)
psql "$DATABASE_URL" -f migrations/2025-10-26-create_property_documents.sql

# dry-run db_clean
node scripts/db_clean.js --pg-tables properties,property_images --dry-run

# real run (careful)
SAFE_TO_RUN=1 node scripts/db_clean.js --pg-tables user_saved_properties,property_images --confirm
```

Files to add
- `migrations/2025-10-26-create_property_documents.sql`
- `migrations/2025-10-26-create_property_documents.rollback.sql`

Notes about Mongo DB name requirement
-----------------------------------

To avoid accidental writes to the default MongoDB database named "test", the project requires an explicit Mongo DB name when using Mongo for any operations (including cleanup).

Set the following in your local `.env.local` (do NOT commit this file):

MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=your_target_database_name

Example `.env.local` (placeholders only):

```
# Database URLs
DATABASE_URL=postgres://user:pass@host:5432/yourdb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB=ubika_poc

# Vercel-managed services
VERCEL_REDIS_URL=rediss://:password@hostname:port
VERCEL_BLOB_TOKEN=your_vercel_blob_token

# Admin secret for protected endpoints
ADMIN_SECRET=replace-with-secure-random-value

# Safety for destructive scripts (optional)
# SAFE_TO_RUN=true
```

The cleanup script `scripts/db_clean.js` will refuse to operate on Mongo unless `MONGODB_DB` is set (or a DB is present in the URI path). This prevents accidental deletion from the default `test` database.

- `scripts/db_clean.js`
- `migrations/README.md`

Acceptance criteria
- Migration SQL exists and is reversible.
- `scripts/db_clean.js` supports both Postgres and Mongo clearing with confirmation safeguards.