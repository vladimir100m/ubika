# PoC Implementation Plan — Vercel Hobby (detailed step-by-step)

Version: v0.1.0
Date: 2025-10-26

Purpose: produce a precise, executable plan to deliver a focused PoC on Vercel Hobby that provides: basic browse/search, property detail, save/favorite, simple admin create/edit, and a serverless sync pipeline and caching strategy. This plan is intentionally conservative (serverless-friendly, minimal infra) and focuses on reusing the existing repo.

Assumptions and constraints
- Hosting: Vercel Hobby (serverless functions, no long-running workers).
- Canonical DB: Neon (Postgres) or any Postgres accessible from your dev machine and Vercel.
 - Canonical DB: Neon (Postgres) or any Postgres accessible from your dev machine and Vercel.
 - NoSQL read-models / denormalized docs: MongoDB via Vercel integration (preferred for PoC denormalized read models).
 - Cache: Vercel Redis (managed) for page- and key-level caches and lightweight rate-limiting.
 - Image storage: Vercel Blob (preferred) — use signed uploads or `public/` static images for PoC.
 - No external paid managed search for initial PoC — simple SQL reads (denormalized) and MongoDB read-models; vector/semantic features deferred.
- Goal: minimal changes that are reversible. Test locally, then deploy to Vercel preview/staging, then production.

Contract (inputs/outputs)
- Inputs: this repo (Next.js app), a dev Postgres DB, Vercel account and env vars.
- Outputs: working PoC deployed on Vercel with the features described, scripts for seeding/cleaning data, migrations for minimal read-model additions, and documentation for running and verifying the PoC.
- Success criteria:
  - App builds and runs locally (`npm run dev`).
  - Can seed sample properties and view search & detail pages.
  - `/api/ai/ingest` is NOT required for PoC; instead `/api/sync-property` handles read-model sync.
  - Deploy to Vercel Hobby; create a property (script or admin UI) and verify the end-to-end flow.

High-level phases and checklist (ordered)
1. Repo audit & mapping (identify reusable components + routes + scripts).
2. Local dev setup & seed data (ensure `npm install`, `npm run dev`, seed scripts work).
3. Safe DB migrations & `db_clean` script (optional but recommended) and a minimal `property_documents` read-model if needed.
4. Sync API route: convert background sync into `/api/sync-property` serverless function.
5. Admin create/edit route + small admin UI under `/admin` (optional minimal form) that calls the create/edit route and then `/api/sync-property`.
6. Browse & Search: wire search page to SQL reads, add server-side caching (optional Vercel Redis) and pagination.
7. Property Detail: reuse existing components (image carousel, highlights) and wire contact form to an API route storing contacts.
8. Save/Favorite: client-side localStorage implementation + optional server API to persist when `user_id` is present.
9. Image handling: signed-upload guidance or use `public/` images for PoC; wire storage URL logic.
10. Tests & CI: add a couple of vitest/jest tests for key flows and a lightweight GitHub Action to run tests.
11. Deploy & verify: Vercel deployment checklist and smoke tests.

Detailed step-by-step plan (actionable)

Phase 1 — Repo audit (2–4 hours)
- Goal: create a precise map of which files/components/routes will be reused or need small changes.
- Actions:
  1. Run a quick code search (locally) for `Property` component references and API routes. Example commands (run on your machine):

```bash
# find UI components and pages mentioning Property
rg "\bProperty\b" src | sed -n '1,200p'
# list app router/api routes
rg "src/app/api|src/pages/api" -n
# list scripts in scripts/
ls -la scripts/
```

  2. Produce `doc/repo-audit.md` summarizing:
     - Component -> file path -> props used -> pages where referenced
     - API routes -> file path -> purpose (auth, write/read)
     - Scripts -> file path -> purpose (seed, migrate, upload)
 - Deliverable: `doc/repo-audit.md` (create file) with an actionable map.

Why: this reduces guessing and tells us exactly what to reuse.

Files likely to reuse (from repo structure):
- `src/app/*` pages, especially search and property detail.
- `src/lib/*` helpers (db.ts, logger.ts, blob.ts)
- `scripts/create-fictional-properties.js` and `scripts/test-create-property.js` for seeding
- `src/components` or `src/ui` components like `PropertyImageGrid`, `PropertyImageCarousel`, `PropertyPopup`.

Phase 2 — Local dev verification & seed (0.5–1 day)
- Goal: ensure developer environment works and we can seed data.
- Actions:
  1. Get dependencies and run app locally:

```bash
npm install
npm run dev
```

  2. Verify seed scripts: run `node scripts/create-fictional-properties.js` (or `node scripts/test-create-property.js`) and verify DB rows.
  3. Manually open key pages: home, search, property detail. Note broken images or missing props.
- Deliverable: short report with any immediate breakages and a list of components requiring changes.

Phase 3 — Safe DB migrations & db_clean (0.5–1 day)
- Goal: provide minimal migrations for a `property_documents` read-model (optional) and a safe `db_clean` script for tests.
- Actions:
  1. Create migration SQL files under `migrations/`, e.g. `2025-10-26-create_property_documents.sql`:

```sql
-- create_property_documents.sql
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  doc JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
```

  2. Add `scripts/db_clean.js` (node) that accepts `--tables` and `--confirm` and runs `TRUNCATE TABLE ... CASCADE` in a safe order. Require a `SAFE_TO_RUN=1` env check to prevent accidental runs. If using MongoDB for read-models, include a safe script to delete/clear the related collection documents (require explicit confirmation).
  3. Add `scripts/run_migrations.sh` that runs the SQL files using `psql` or your runner with `DATABASE_URL`.
- Deliverable: migration SQLs + db_clean + readme notes in `migrations/README.md` about rollbacks.

Phase 4 — Convert background sync into serverless `/api/sync-property` (0.5–1 day)
- Goal: provide a serverless endpoint to build denormalized read-models, rebuild caches, and be called post-create/edit.
- Actions:
  1. Add route `src/app/api/sync-property/route.ts` (App Router) or `src/pages/api/sync-property.js` with this contract:
     - POST body: { id: <property_id> } or query param `?id=...`
     - Auth: require `ADMIN_SECRET` header/env (simple secret) to avoid public writes.
  2. Implementation flow inside the route:
     - Read property by id from main `properties` table using existing DAL (`src/lib/db.ts`).
     - Build `doc` JSON: select fields (title, description, price, images, features, neighborhood/city, computed price_per_m2).
     - Upsert into `property_documents` table.
  - Purge cache key `property:{id}` in Vercel Redis if configured.
     - Return 200 with `{ ok: true }`.
  3. Add a small unit test to simulate the endpoint using a mock DB or integration test against a dev DB.
- Deliverable: `src/app/api/sync-property/route.ts` and test.

Phase 5 — Admin create/edit route + admin UI (1–2 days)
- Goal: let a human create/edit properties in the PoC without a full CMS.
- Actions:
  1. Add minimal serverless endpoints:
     - POST `/api/admin/property` — create property record (basic validation), returns new id.
     - PUT `/api/admin/property/:id` — update existing property.
     - Protect both with `ADMIN_SECRET`.
  2. Add minimal admin UI page `src/app/admin/page.tsx` with a simple form (title, description, price, images as URLs) that POSTs to the create endpoint and then calls `/api/sync-property`.
  3. For image uploads in PoC: either:
     - Use Vercel Blob signed URLs (if Vercel Blob configured) — add `src/lib/blob.ts` helper to create signed URLs, or
     - Allow pasting direct image URLs or reference images in `public/`.
  4. After create/update, call `/api/sync-property?id=<id>` to keep read-models in sync.
- Deliverable: admin endpoints + simple `/admin` UI.

Phase 6 — Browse & Search implementation (1–2 days)
- Goal: fast, correct search results for PoC using SQL with optional caching.
- Actions:
  1. Implement server-side search handler (existing `search` page or `src/app/api/search/route.ts`) that accepts filters: city, priceMin, priceMax, page, pageSize.
  2. SQL pattern (simplified):

```sql
SELECT id, title, price, currency, images, city, bedrooms
FROM properties
WHERE (city = $1 OR $1 IS NULL)
  AND (price >= $2 OR $2 IS NULL)
  AND (price <= $3 OR $3 IS NULL)
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;
```

  3. Wire server-side rendering / client fetch on search page to call the endpoint and render results with existing `PropertyCard` components.
  4. Add simple pagination controls or infinite-scroll on client side.
  5. Optional: add caching using Vercel Redis: cache search queries keyed by query+page for N seconds.
- Deliverable: working search page, page-level results cached optionally.

Phase 7 — Property detail (0.5–1 day)
- Goal: reuse components and display full detail plus contact form.
- Actions:
  1. Wire detail page to read from `property_documents` if exists otherwise fall back to `properties` join queries.
  2. Reuse `PropertyImageCarousel` and `PropertyPopup` components — refactor props if necessary to accept the PoC doc shape.
  3. Implement contact form submission to `POST /api/property-contact` which stores a record in `property_contacts` table (or a small in-repo JSON/log if DB table not desired for PoC). Protect spam with a lightweight honeypot field.
- Deliverable: functional property detail page with working contact form storing records.

Phase 8 — Save / Favorite (0.5 day)
- Goal: support anonymous saves (localStorage) and optional server persistence.
- Actions:
  1. Add a `Save` button on property cards and detail page that toggles a flag in localStorage (`ubika.savedProperties = [ids...]`). Update UI state across pages via a small client hook `useSavedProperties()`.
  2. Optional server API (protected) to persist saved properties if `user_id` header present: `POST /api/user-saved-properties`.
- Deliverable: local save UX and API stub.

Phase 9 — Image handling & static assets (0.5 day)
- Goal: ensure images display reliably on PoC without a full upload processor.
- Actions:
  1. For PoC, prefer: include a small set of images in `public/sample-images/` and point properties to those URLs in seed data.
  2. If you prefer uploads: implement signed URLs for Vercel Blob or accept a paste URL field in admin UI.
- Deliverable: stable images in the PoC pages.

Phase 10 — Rate-limiting & security (0.5 day)
- Goal: protect write endpoints and public routes from abuse.
- Actions:
  1. Add `ADMIN_SECRET` check for admin endpoints and sync endpoints. Read from `process.env.ADMIN_SECRET` and require header `x-admin-secret`.
  2. Add light rate-limiter using Vercel Redis for any public endpoint that could be abused (contact form, search) — or a simple in-memory rate limiter for dev only.
-- Deliverable: secret-protected admin endpoints and optional Vercel Redis-backed rate limiter.

Phase 11 — Tests & CI (0.5–1 day)
- Goal: small automated checks to catch regressions.
- Actions:
  1. Add a couple of unit tests (jest/vitest):
     - DAL: `getPropertyById()` returns expected property shape for seed fixtures.
     - Sync API: calling `/api/sync-property` upserts a doc row.
  2. Add `.github/workflows/ci.yml` that runs `npm ci`, `npm run build`, and tests.
- Deliverable: tests and CI workflow.

Phase 12 — Deploy & verification (0.5 day)
- Goal: deploy PoC to Vercel and execute a short verification checklist.
- Actions (deploy checklist):
  1. Create a Vercel project connected to this repo. Add environment variables in Vercel (Preview): `DATABASE_URL`, `ADMIN_SECRET`, `MONGODB_URI` (if using Vercel-managed MongoDB), optionally `VERCEL_REDIS_URL`, `VERCEL_BLOB_TOKEN`.
  2. Deploy; wait for a preview build. If build fails, inspect Vercel logs and fix minimal issues.
  3. Run seed script (from local machine) to populate staging DB.
  4. Test end-to-end: search -> open detail -> contact -> admin create -> sync -> verify detail updated.
  5. If caching used, verify cache invalidation on `/api/sync-property`.
- Deliverable: Live PoC on Vercel with verification notes.

Rollout and rollback guidance
- Migrations: each SQL file should be reversible. Include a rollback SQL file next to each migration.
- Backups: take a DB snapshot before running migrations on production.
- If a deploy breaks, roll back via Vercel deployment history and revert migrations if needed.

Observability and minimal metrics (PoC)
- Console logs in key serverless functions (sync, admin create) including id, user, duration, and outcome.
 - Simple counters persisted to Vercel Redis for: `sync.count`, `admin.create.count`, `contact.submissions`.
- Add a small `doc/poc-vercel-verify.md` with verification steps and screenshots.

Deliverables (files to add or update)
- `doc/repo-audit.md` — map of UI components, routes, scripts (produced in Phase 1).
- `migrations/2025-10-26-create_property_documents.sql` + rollback SQL.
- `scripts/db_clean.js` and `scripts/run_migrations.sh`.
- `src/app/api/sync-property/route.ts` (or pages/api equivalent).
- `src/app/admin/page.tsx` (simple admin form) and `src/app/api/admin/property/route.ts` (create/update).
- `src/app/api/property-contact/route.ts`.
- `src/app/api/search/route.ts` (if missing) or adapt existing search logic.
- `public/sample-images/*` and updated seed script.
- Tests under `test/` and `.github/workflows/ci.yml`.

Minimal environment variables (PoC)
- DATABASE_URL
 - ADMIN_SECRET
 - MONGODB_URI (Vercel-managed MongoDB connection string for read-models)
 - REDIS_URL or VERCEL_REDIS_URL (Vercel-managed Redis connection string)
 - VERCEL_BLOB_TOKEN (Vercel Blob upload token)

Try-it commands (local)

```bash
# install
npm ci
# run locally
npm run dev
# seed sample data (example)
node scripts/create-fictional-properties.js
# run a single sync call
curl -X POST "http://localhost:3000/api/sync-property" -H "x-admin-secret: $ADMIN_SECRET" -d '{"id":"<PROPERTY_ID>"}'
```

Edge cases and risks (and mitigations)
- Long-running sync tasks: keep sync idempotent and short; for large workloads run `scripts/ingest_all.js` from a dev machine.
- DB schema mismatch: prefer additive migrations and test on a staging DB first.
- Image hosting unavailable: fall back to `public/` static images for PoC.
- Secret leakage: never commit secrets; use Vercel environment variables.

Estimated timeline (single engineer, focused): 5–9 working days total across phases depending on refactor scope.

Next immediate actions I can take for you (pick one):
- Implement Phase 1: create `scripts/repo_audit.sh` and `doc/repo-audit.md` (quick, helps scope next steps).
- Implement Phase 3: create migrations and `scripts/db_clean.js` for safe truncation.

Which do you want me to start implementing now? Or should I create the `doc/implementation-plan-poc.md` in the repository now? (I can also do the implementation changes directly.)
