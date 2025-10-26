# PoC Proposal — Vercel Hobby (free) — v0.1.0 (2025-10-26)

## Goal

## Use cases covered

## Reuse from repo (what we can recycle)

## Minimal technical approach (PoC constraints)
  - Next.js app deployed with Vercel; API routes map to serverless functions.

## Minimal code changes required

## Minimal requirements & detailed use cases (PoC scope)
1) Browse & Search (PoC)
  - Simple search by city and price range.
  - Pagination or infinite scroll (client-side).
  - Use the denormalized `properties` SQL queries (or NoSQL docs if available). For PoC, SQL reads are acceptable.
  - Cache page-level responses in Redis (optional for PoC).

2) Property detail
  - Show main price, images carousel (use a few sample images), highlights (features), and neighborhood summary.
  - Contact form on detail page that submits to a serverless API route which stores the contact record (or emails if SMTP configured).
  - Reuse `PropertyImageGrid`, `PropertyImageCarousel` components and `PropertyPopup` for inline previews.

3) Save / Favorite
  - Allow an anonymous save (localStorage) plus optional server-side save to `user_saved_properties` if user auth exists.
  - For PoC keep the server-side save as an optional API route that requires a `user_id` header.

4) Create / Edit Listing (Admin)
  - Protected API route that accepts basic property data and images and writes to Postgres.
  - Optionally, provide a simple admin UI under `/admin` that posts to that route.
  - On Vercel Hobby, uploads should use signed URLs to Vercel Blob or direct uploads to storage; otherwise keep images in repo for PoC.

5) Sync & Caching (Lightweight)
  - After a listing is created/updated, call `/api/sync-property?id=...` which will build the read-model (if using NoSQL) and purge `property:{id}` cache key.
  - Implement sync as a serverless function (one-off) to avoid running persistent workers on Hobby plan.

## Full necessary requirements for an MVP (beyond PoC)
  - Vercel (or equivalent) for Next.js deployment (edge + serverless functions)
  - Neon (Postgres) production database with backups and monitoring
  - Managed Redis (Redis Cloud / AWS Elasticache) for caches and pub/sub
  - NoSQL (MongoDB/ DynamoDB) for denormalized read models or a managed search provider (Algolia)
  - Object Storage + CDN (S3 / Cloudflare / Vercel Blob)
  - Managed search (Algolia/Elastic) or self-managed OpenSearch cluster

  - Full CRUD for properties with validation, image upload pipeline and background media processing (thumbnails, sizes, formats)
  - Auth + user profiles (Auth provider integration e.g., NextAuth, Neon Auth)
  - Listing lifecycle: publish/unpublish, price-history, status-history
  - Search & filter service with geo queries, facets, and full-text search
  - Notifications: email / SMS for scheduler and agent contact
  - Analytics: impressions, clicks, conversion tracking, basic dashboards

  - CI/CD pipelines (automatic deployments, previews)
  - Secrets management (Vercel env, Vault), DB backups and migrations (Flyway/Prisma/pg-migrate)
  - Monitoring: logs, metrics, traces, alerts
  - Rate-limiting, WAF rules, vulnerability scans

# Implementation plan (PoC, step-by-step)
1. Prepare Vercel project and set environment variables (`DATABASE_URL`, `REDIS_URL` if available, BLOB keys).
2. Reuse code and run locally: `npm install` and `npm run dev` — verify pages render and scripts seed data (`node scripts/create-fictional-properties.js`).
3. Convert background sync into an API route `/api/sync-property` and wire admin flows to call it after edits.
4. Deploy to Vercel Hobby and run a quick end-to-end test: create a property (via script or admin UI), confirm detail page, run sync, verify caches invalidated.
5. Iterate on performance: optionally add Redis if not present, or rely on SQL reads for small traffic PoC.

## Risks & Mitigations

## Deliverables for the PoC

Document created: v0.1.0 — 2025-10-26
