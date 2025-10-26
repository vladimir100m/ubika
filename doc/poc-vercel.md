# PoC Proposal — Vercel Hobby (free) — v0.1.0 (2025-10-26)

Goal
- Quickly validate the Ubika application user flows on a Vercel Hobby/free-tier deployment re-using as much of the current repo as possible.
- Deliver a lightweight, deployable PoC that demonstrates: listing browse/search, property detail, image handling, and contact/schedule flows with canonical storage in Neon (free tier) and caching via Redis (free tier or managed trial).

Use cases covered
- Public: Browse listings (search + filters), view property detail pages with images and highlights, view neighborhood summary.
- User: Save/favorite a property (lightweight), contact agent (form), schedule a tour (form submission).
- Admin (minimal): Create/edit a listing via a protected API route (or seed via script) and upload images.
- Background: Sync worker that updates NoSQL read-model and invalidates cache (PoC can run as a lightweight serverless function or simple background job triggered manually).

Reuse from repo (what we can recycle)
- UI & routing: All Next.js pages and components under `src/pages` / `src/ui` / `src/app` can be reused as-is for the PoC.
- Types: `src/types/index.ts` — models to keep type-safety across API and workers.
- DB helpers: `src/lib/db.ts`, and scripts under `scripts/` (create-fictional-properties.js, test-create-property.js) — useful for seeding and schema work.
- Image utils & components: `src/ui/PropertyImageGrid.tsx`, `src/ui/PropertyImageCarousel.tsx`, `src/lib/propertyImageUtils.ts`.
- API routes: existing serverless API endpoints under `src/app/api` can be reused with minor adjustments for Vercel environment.
- CSS/modules: existing styles under `src/styles` and `styles/` can be reused directly for PoC visuals.

Minimal technical approach (PoC constraints)
- Host frontend & serverless API on Vercel (Hobby/free)
  - Next.js app deployed with Vercel; API routes map to serverless functions.
- Database: Neon free tier (serverless Postgres). Use credentials from `.env.local` (already present in repo).
- Redis: Use a free Redis provider (Redis Cloud free tier) or replace with an in-process memory cache for strict PoC constraints (not recommended beyond PoC).
- File storage: Use Vercel Blob (free tier) or store image URLs in the repo/data for demo images.
- Sync worker: Implement a simple serverless function triggered by Redis pub/sub or an admin API call to re-sync a single property (instead of running long-lived workers on the free plan).

Minimal code changes required
- Ensure `DATABASE_URL` is set via Vercel Environment Variables (do not commit secrets). `.env.local` should be used locally only.
- Convert any long-running background tasks into on-demand API routes for PoC (e.g., `/api/sync-property?id=...` that runs the worker logic once).
- Optionally stub Redis with an in-memory cache for local PoC; in Vercel use a managed Redis instance by setting `REDIS_URL` env var.
- Add small revalidation API to trigger Next.js ISR page revalidation after property update.

Minimal requirements & detailed use cases (PoC scope)
1) Browse & Search (PoC)
- Minimal features:
  - Simple search by city and price range.
  - Pagination or infinite scroll (client-side).
- Implementation notes:
  - Use the denormalized `properties` SQL queries (or NoSQL docs if available). For PoC, SQL reads are acceptable.
  - Cache page-level responses in Redis (optional for PoC).

2) Property detail
- Minimal features:
  - Show main price, images carousel (use a few sample images), highlights (features), and neighborhood summary.
  - Contact form on detail page that submits to a serverless API route which stores the contact record (or emails if SMTP configured).
- Implementation notes:
  - Reuse `PropertyImageGrid`, `PropertyImageCarousel` components and `PropertyPopup` for inline previews.

3) Save / Favorite
- Minimal features:
  - Allow an anonymous save (localStorage) plus optional server-side save to `user_saved_properties` if user auth exists.
- Implementation notes:
  - For PoC keep the server-side save as an optional API route that requires a `user_id` header.

4) Create / Edit Listing (Admin)
- Minimal features:
  - Protected API route that accepts basic property data and images and writes to Postgres.
  - Optionally, provide a simple admin UI under `/admin` that posts to that route.
- Implementation notes:
  - On Vercel Hobby, uploads should use signed URLs to Vercel Blob or direct uploads to storage; otherwise keep images in repo for PoC.

5) Sync & Caching (Lightweight)
- Minimal behavior:
  - After a listing is created/updated, call `/api/sync-property?id=...` which will build the read-model (if using NoSQL) and purge `property:{id}` cache key.
- Implementation notes:
  - Implement sync as a serverless function (one-off) to avoid running persistent workers on Hobby plan.

Full necessary requirements for an MVP (beyond PoC)
- Infrastructure
  - Vercel (or equivalent) for Next.js deployment (edge + serverless functions)
  - Neon (Postgres) production database with backups and monitoring
  - Managed Redis (Redis Cloud / AWS Elasticache) for caches and pub/sub
  - NoSQL (MongoDB/ DynamoDB) for denormalized read models or a managed search provider (Algolia)
  - Object Storage + CDN (S3 / Cloudflare / Vercel Blob)
  - Managed search (Algolia/Elastic) or self-managed OpenSearch cluster

- App features & endpoints
  - Full CRUD for properties with validation, image upload pipeline and background media processing (thumbnails, sizes, formats)
  - Auth + user profiles (Auth provider integration e.g., NextAuth, Neon Auth)
  - Listing lifecycle: publish/unpublish, price-history, status-history
  - Search & filter service with geo queries, facets, and full-text search
  - Notifications: email / SMS for scheduler and agent contact
  - Analytics: impressions, clicks, conversion tracking, basic dashboards

- Operational & security
  - CI/CD pipelines (automatic deployments, previews)
  - Secrets management (Vercel env, Vault), DB backups and migrations (Flyway/Prisma/pg-migrate)
  - Monitoring: logs, metrics, traces, alerts
  - Rate-limiting, WAF rules, vulnerability scans

Implementation plan (PoC, step-by-step)
1. Prepare Vercel project and set environment variables (`DATABASE_URL`, `REDIS_URL` if available, BLOB keys).
2. Reuse code and run locally: `npm install` and `npm run dev` — verify pages render and scripts seed data (`node scripts/create-fictional-properties.js`).
3. Convert background sync into an API route `/api/sync-property` and wire admin flows to call it after edits.
4. Deploy to Vercel Hobby and run a quick end-to-end test: create a property (via script or admin UI), confirm detail page, run sync, verify caches invalidated.
5. Iterate on performance: optionally add Redis if not present, or rely on SQL reads for small traffic PoC.

Risks & Mitigations
- Long-running workers not available on free tiers: mitigate by using on-demand serverless functions or scheduled invocations.
- DB connection limits on free Neon plan: use connection pooling and prefer short-lived queries in serverless functions.
- Media processing: expensive on free plan—use pre-generated images for PoC or outsource to a simple serverless function that only runs on-demand.

Deliverables for the PoC
- `doc/poc-vercel.md` (this file)
- Minimal admin UI under `/admin` (optional scaffold)
- `/api/sync-property` serverless route
- Seed script (`scripts/create-fictional-properties.js`) to populate demo data
- Deployment to Vercel Hobby with env variables documented in README

Document created: v0.1.0 — 2025-10-26
