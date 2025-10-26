---
title: "LLM Implementation Plan"
version: v0.1.0
date: 2025-10-26
---
# LLM Implementation Plan — detailed steps

## Purpose
- Provide a concrete, step-by-step plan to integrate LLM-powered features into the Ubika codebase. The plan covers repo audit, safe database cleanup, Neon/Postgres schema updates, creating/deleting columns and tables, adding AI routes, embedding storage (vector store) choices, data model documentation, and testing/deployment guidance.

## Assumptions / constraints (Vercel Hobby-focused)
- Target PoC environment: Vercel Hobby (Hobby/Free tier) running a Next.js app with serverless API functions. This environment has no long-running process support and has stricter connection and execution-time constraints.
- Canonical DB: Neon (Postgres) free tier — use Neon serverless pooling features to avoid connection limits in serverless functions.
- Storage: Vercel Blob for images/media (recommended for tight integration with Vercel deployments).
- NoSQL: MongoDB Atlas (via Vercel integration) or another managed document store for denormalized read models; prefer a managed provider with a free tier for PoC.
- Redis/pubsub: use a serverless-friendly provider such as Upstash (recommended for Vercel) or Redis Cloud. Avoid running a self-hosted Redis on Hobby plan.
- Vector storage: prefer Postgres+pgvector in Neon if Neon supports it on your plan; otherwise use a managed vector DB or Atlas vector features. Select the option that minimizes additional infra for the PoC.
 - Use reversible migrations and documented rollback steps before destructive DB changes.

Notes about constraints
- No persistent workers: convert background jobs into idempotent, on-demand serverless functions (e.g., `/api/sync-property`) or scheduled invocations (cron) supported by Vercel integrations.
- Connection limits: use Neon/serverless pooling and short-lived DB connections. For Redis use REST-based Upstash to avoid persistent TCP connections.
- Cold starts and execution time: keep serverless handlers lightweight, batch work, and offload heavy processing (image transforms) to one-off functions or external services.

## High level steps (list)
1. Repo audit: inventory code, components, API routes, scripts and styles to reuse.
2. Clean the DB (truncate/delete) in a controlled way.
3. Update Neon/Postgres schema: add tables/columns required for LLM features and embeddings; drop unused columns/tables per agreed plan.
4. Implement a vector storage approach (pgvector or external vector DB) and create indexes.
5. Add serverless AI routes (ingest, query, generate, assist) and small worker/sync endpoints.
6. Implement ingestion pipeline: property -> denormalized doc -> text extraction -> embeddings -> store.
7. Implement query & ranking: semantic search + filter by SQL/NoSQL attributes.
8. Add admin tools + tests + CI for schema migrations and AI routes.
9. Deploy to staging / test end-to-end; iterate.

## Detailed plan and implementation notes

### Step 1 — Repo audit (what to check)
- Inventory UI components that will show LLM outputs: property pages, detail popups, admin edit pages, search results components (`src/app`, `src/ui`, `src/pages`). Mark components to reuse.
- Inventory API routes under `src/app/api` and `src/pages/api` — identify routes to modify or wrap with AI capabilities (e.g., property detail route, search route, admin create/edit routes).
- Identify scripts in `scripts/` that will be helpful for bulk ingest or seeding (e.g., `create-fictional-properties.js`, `test-create-property.js`).
- Collect environment variables currently in `.env.local` and generate an `env.example` listing new AI-related secrets: `OPENAI_API_KEY` (or other provider), `VECTOR_DB_URL`, `USE_PGVECTOR=true|false`, `EMBEDDING_MODEL`, etc.


### Step 2 — Clean the DB safely (delete all data)
- Provide a controlled truncation/deletion approach for chosen tables in correct dependency order (truncate child tables before parents or use `CASCADE`). Prefer explicit table list rather than `DROP SCHEMA public CASCADE` in production.

Note for Vercel PoC:
- Run `scripts/db_clean.js` from a local machine or CI runner (not from Vercel serverless functions) to avoid execution-time limits and accidental destruction during deployments.

#### Example SQL for controlled truncation
```sql
BEGIN;
TRUNCATE TABLE user_saved_properties CASCADE;
TRUNCATE TABLE property_media CASCADE;
TRUNCATE TABLE property_images CASCADE;
TRUNCATE TABLE properties CASCADE;
COMMIT;
```

### Step 3 — Update Neon/Postgres schema
- Create migrations (sql files or use your migration tool) that:
  - Add `property_documents` (denormalized JSONB) table for fast reads.
  - Add `embeddings` table (if using pgvector) or `property_embeddings` with a vector column.
  - Add necessary columns to `properties` (if missing): `summary`, `generated_description`, `nl_tone`, `last_ai_processed_at`.
  - Drop deprecated columns/tables only after verifying no code uses them.

### Suggested schema snippets

#### Denormalized property documents
```sql
CREATE TABLE property_documents (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  doc JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_property_documents_city ON property_documents((doc->>'city'));
```

#### Embeddings with pgvector (preferred when using Neon + pgvector extension)
```sql
-- enable pgvector extension if allowed
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE property_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  text_source TEXT, -- what text was embedded
  embedding vector(1536), -- size depends on model
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_property_embeddings_embedding ON property_embeddings USING ivfflat (embedding) WITH (lists = 100);
```

If pgvector is not an option, plan to use an external vector DB (Pinecone, Milvus, Weaviate, or Supabase vector tables) and keep references to that DB in `property_embeddings_meta`.

### Step 4 — Vector storage & indexing options (Vercel PoC choices)

For the Vercel Hobby PoC we prefer minimal extra services while keeping acceptable performance. Choose one of the following depending on Neon/provider feature support and cost:

- Option A — pgvector in Neon (preferred if available)
  - Why: keeps everything in Postgres/Neon, reduces cross-service complexity, and simplifies backups/consistency.
  - Requirements: Neon plan must allow the `vector` extension and index memory for ivfflat. Use a conservative index configuration for PoC (smaller `lists`).
  - Pros: fewer services, transactional consistency, single backup surface.
  - Cons: may hit memory/index limits on free tiers for large corpora.

- Option B — MongoDB Atlas with Vector Search (good Vercel integration path)
  - Why: If Neon cannot host pgvector, use Atlas (managed by Vercel integration) — Atlas supports vector search features or can be used alongside a simple vector index.
  - Pros: managed vector search, scales independently, free tier available for PoC.
  - Cons: another provider to manage and monitor.

- Option C — External managed vector DB (Pinecone / Weaviate / Milvus / Supabase vector)
  - Why: Use when you want best-in-class vector search during PoC or anticipate fast scale.
  - Pros: optimized retrieval latencies and managed indexing.
  - Cons: extra cost and integration complexity.

Implementation guidance for PoC
- Prefer Option A for simplicity when Neon supports pgvector. If not available, Option B (MongoDB Atlas) is the most Vercel-friendly fallback. Use Option C only if PoC requires advanced vector features or you already have credits.

### Step 5 — Serverless AI routes & endpoints
- Minimal set of routes to add under `src/app/api/ai` or `src/pages/api/ai`:
  - POST `/api/ai/ingest` — accept property ids or a batch; reads canonical data, creates denormalized doc, extracts text, calls embedding API, stores embeddings.
  - POST `/api/ai/query` — semantic query endpoint: accepts user query + optional filters (city, price range), returns ranked property ids + snippets.
  - POST `/api/ai/generate-description` — generate or improve property descriptions using an LLM (optionally store `generated_description`).
  - POST `/api/ai/summarize` — summarize long `description` or agent notes.
  - POST `/api/ai/assist-admin` — assistant for admin tasks (generate tags, categorize features).

#### Implementation notes for routes (Vercel PoC considerations)
- Route placement: implement routes under `src/app/api/ai` (Next.js App Router) so Vercel deploys them as serverless API functions.
- Keep logic thin in route handlers: validate input, call service functions in `src/lib/ai/*` which encapsulate API calls and DB writes.
- Auth & secrets:
  - Admin routes (`/api/ai/ingest`, `/api/ai/assist-admin`, `/api/ai/generate-description`) must be protected with a secret (e.g., Vercel Environment Variable) or JWT.
  - Public query routes should have rate limits and quotas to control LLM costs.
- Rate limiting & quotas:
  - Prefer Upstash rate-limiting or a lightweight token bucket implementation in Redis/Upstash for the Hobby plan.
- Integrations for Vercel Hobby:
  - Use Vercel Blob signed upload endpoints for any files referenced in docs; store the blob URLs in SQL/NoSQL as source content.
  - Use Upstash (REST) for Redis-like pub/sub and small caches — avoids long-lived TCP connections that serverless functions can't hold.
- Background processing:
  - Convert heavy jobs to on-demand endpoints (e.g., `/api/ai/ingest?batch=...`) and trigger them from an admin UI or a scheduled Vercel Cron job (using Vercel Cron or GitHub Actions to call the endpoint).
  - For larger backfills, run `scripts/ingest_all.js` from a developer machine or CI runner to avoid execution-time limits on serverless functions.

### Step 6 — Ingest pipeline (property -> embeddings)
1. Read canonical property details from Postgres (DAL).
2. Create a denormalized JSON doc (property_documents) that includes: title, description, features, neighborhood summary, main image urls, price, address, searchable tags, and computed fields (price_per_m2).
3. Extract textual content to embed: title + description + features + neighborhood summary + computed tags.
4. Chunk text when large and call embedding API (OpenAI / Anthropic / local models) to get vectors for each chunk. For PoC use conservative chunk sizes (e.g., 500–1,000 tokens) and batch requests to reduce API overhead.
5. Store embedding vectors in `property_embeddings` (pgvector) or in external vector DB and keep mapping to property_id. If using Vercel Blob for media, embed only text extracted from images (OCR) or captions — store blob URLs as part of the denormalized doc.
6. Optionally store a small retrieval-augmented snippet index to accelerate result snippets.

Notes for cost & reliability
- Batch embedding requests where possible to reduce per-request overhead and control token costs.
- Use a queue or rate-limiter (Upstash or simple in-process limiter) to avoid hitting LLM provider rate limits from serverless functions.

### Step 7 — Query & ranking
- On `/api/ai/query`:
  - Convert user query to embedding.
  - Run a nearest-neighbors vector search (pgvector or external) to get candidate property_ids.
  - Post-filter candidates by SQL attributes (city, price range, bedrooms) to satisfy strict filters.
  - Score results with a small re-ranking pass (optionally call LLM for final natural-language snippet generation) and return results.

### Step 8 — Data models (documented)

#### Canonical SQL models (existing core)
- `properties` — canonical listing record (id, title, description, price, bedrooms, bathrooms, square_meters, property_type_id, status, seller_id, created_at, updated_at)
- `property_images` — images with `property_id`, `url`, `display_order`, `is_cover`
- `property_media` — other media types

#### LLM / read-model additions
- `property_documents` (JSONB) — denormalized doc used for building embeddings and fast reads.
  - doc fields: { id, title, description, summary, features:[], images:[], neighborhood:{name, city}, price, currency, price_per_m2, tags:[], created_at }
- `property_embeddings` (vector) — stores embedding vectors with `property_id`, `text_source`, `created_at`.

#### Example of a denormalized doc (JSON)
```json
{
  "id": "uuid",
  "title": "Bright 2BR with sea view",
  "description": "...",
  "summary": "2BR, 1BA, 85m², sea view",
  "features": ["balcony","parking"],
  "images": ["https://.../img1.jpg"],
  "neighborhood": {"id":"n-uuid","name":"Centro","city":"Montevideo"},
  "price": 125000,
  "currency": "USD",
  "price_per_m2": 1470
}
```

### Step 9 — Tests, CI, and validation
- Add unit tests for DAL methods, the ingest pipeline (mocking embedding API), and API routes (jest / vitest).
- Add integration test that runs ingest on a small seed dataset and verifies embeddings created and queries return expected results.
- Add a GitHub Actions workflow to run tests and a build step for preview deployments.

### Step 10 — Deployment & monitoring
- Environment variables to add to Vercel/production:
  - `DATABASE_URL`, `REDIS_URL` (if used), `OPENAI_API_KEY` (or other), `USE_PGVECTOR=true|false`, `VECTOR_DB_URL`, `EMBEDDING_MODEL`.
- Add basic metrics and logs for ingest and query endpoints (request counts, latency, errors, token usage/costs).
- Monitor vector DB size and index memory usage.

#### Vercel-specific deployment notes
- Vercel Environment Variables: add `DATABASE_URL`, `MONGODB_URI`, `VERCEL_BLOB_TOKEN` (or provider key), `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, `OPENAI_API_KEY`, `USE_PGVECTOR=true|false`, `VECTOR_DB_URL`, and `EMBEDDING_MODEL` as appropriate. Keep secrets out of repo and use Vercel's environment settings.
- Function timeouts & cold starts: keep serverless function runtime short. For heavy or long-running backfills use CI runners or one-off scripts executed outside Vercel functions.
- Cron / scheduled jobs: use Vercel's Cron Jobs (or GitHub Actions) to trigger periodic ingest/sync endpoints rather than running persistent workers.
- Preview deployments: use Vercel Preview Deployments to test new ingestion or schema changes against a staging Neon DB before production.

#### Monitoring & cost controls
- Track token costs (LLM provider usage) and add per-route quotas or usage alerts.
- Add logging for embedding calls (counts, errors) and implement exponential backoff / retries for provider rate limits.

## Security & cost considerations
- Rate-limit public AI endpoints; require API keys for admin endpoints.
- Track and limit LLM token usage to control costs; batch embedding calls where sensible.
- Keep the embedding model size and vector dimension consistent and record the dimension in schema comments.

## Operational rollback plan
- If new schema causes issues, use reversible migrations and documented rollback steps. Maintain migration scripts in `migrations/` with reversible steps.

## Appendix — Example minimal ingestion pseudo-code (node)
// src/lib/ai/ingest.js (sketch)
```js
import { getPropertyById } from '../lib/dal';
import { upsertPropertyDocument } from '../lib/dal/docs';

export async function ingestProperty(id) {
  const prop = await getPropertyById(id);
  const doc = buildDocFromProperty(prop);
  await saveEmbedding({ property_id: id, embedding, text_source: 'full' });
}
```
- Milestone 1 (Week 1): Repo audit, create migrations for `property_documents` and `property_embeddings` and small DAL extraction.
- Milestone 2 (Week 2): Implement ingestion route and local ingest of seed data with pgvector or external vector DB.
- Milestone 3 (Week 3): Implement `/api/ai/query`, add basic UI integration for semantic search and generated descriptions, run E2E tests.

## Closing notes
- Start small and keep the ingestion pipeline reversible. Prefer Postgres + pgvector for PoC if Neon supports it; otherwise use an external vector DB. Protect costs and keys, and add monitoring early.
