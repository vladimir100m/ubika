# Step 05 — Sync endpoint and read-model upsert

Purpose
- Implement `/api/sync-property` serverless function that builds the denormalized doc from canonical Postgres data and upserts into Mongo read-model, then purges Redis cache.

Contract
- POST /api/sync-property
  - Body: { id: <property_id> }
  - Auth: header `x-admin-secret` === process.env.ADMIN_SECRET
  - Success: 200 { ok: true }

Actions
1. Create `src/app/api/sync-property/route.ts` (App Router) with the above contract.
2. Implementation flow:
   - Validate admin secret.
   - Fetch property from Postgres using existing DAL (`src/lib/db.ts`).
   - Build denormalized doc (title, description, price, images, features, neighborhood, price_per_m2).
   - Call `readModel.upsertPropertyDocument(propertyId, doc)`.
   - Purge Redis cache key `property:{id}`.
   - Increment `sync.count` metric in Redis.

Files to add/edit
- `src/app/api/sync-property/route.ts`
- Unit test under `test/sync.spec.ts` mocking DB and Mongo.

Acceptance criteria
- Endpoint upserts doc into Mongo and clears Redis key in integration or mocked test.
- Protected by ADMIN_SECRET.