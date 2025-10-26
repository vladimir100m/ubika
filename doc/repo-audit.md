# Repo Audit

Generated: Sun Oct 26 18:09:27 UTC 2025 UTC

## Summary

This audit lists key routes, API endpoints, scripts, migrations and important libraries for the PoC refactor (Mongo read-model + Redis cache).

## Next.js App Routes (src/app)

 - src/app/seller/page.tsx
 - src/app/property/[id]/page.tsx
 - src/app/map/page.tsx
 - src/app/layout.tsx
 - src/app/api/cache/refresh/route.ts
 - src/app/api/properties/images/set-cover/route.ts
 - src/app/api/properties/images/route.ts
 - src/app/api/properties/images/[id]/route.ts
 - src/app/api/properties/route.ts
 - src/app/api/properties/[id]/images/route.ts
 - src/app/api/properties/[id]/route.ts
 - src/app/api/ai/ingest/route.ts
 - src/app/api/ai/query/route.ts
 - src/app/api/debug/cache-metrics/route.ts
 - src/app/api/debug/current-user/route.ts
 - src/app/api/debug/sellers/route.ts
 - src/app/page.tsx

## Pages (src/pages)

 - src/pages/404.tsx
 - src/pages/auth/signin.tsx
 - src/pages/account.tsx
 - src/pages/_error.tsx
 - src/pages/_document.tsx
 - src/pages/recent-searches.tsx
 - src/pages/_app.tsx

## API routes (app router: src/app/**/api)

 - src/app/api/cache/refresh/route.ts
 - src/app/api/properties/images/set-cover/route.ts
 - src/app/api/properties/images/route.ts
 - src/app/api/properties/images/[id]/route.ts
 - src/app/api/properties/route.ts
 - src/app/api/properties/[id]/images/route.ts
 - src/app/api/properties/[id]/route.ts
 - src/app/api/ai/ingest/route.ts
 - src/app/api/ai/query/route.ts
 - src/app/api/debug/cache-metrics/route.ts
 - src/app/api/debug/current-user/route.ts
 - src/app/api/debug/sellers/route.ts

## API routes (pages router: src/pages/api)

 - src/pages/api/auth/[...nextauth].ts
 - src/pages/api/property-statuses.ts
 - src/pages/api/blobs/upload.ts
 - src/pages/api/blobs/resolve.ts
 - src/pages/api/property-features.ts
 - src/pages/api/neighborhoods.ts
 - src/pages/api/property-types.ts
 - src/pages/api/property-operation-statuses.ts

## Scripts

 - scripts/assign-property-to-user.js
 - scripts/clear-all-cache.js
 - scripts/clear-cache.js
 - scripts/clear-database.js
 - scripts/create-fictional-properties.js
 - scripts/create-properties-for-seller.js
 - scripts/create_atlas_index.sh
 - scripts/db_clean.js
 - scripts/db_list_schema.js
 - scripts/debug-image-upload.js
 - scripts/fix-seller-view.js
 - scripts/flush-redis.js
 - scripts/insert_multiple_embeddings.js
 - scripts/insert_sample_embedding.js
 - scripts/migrate-image-schema.js
 - scripts/mongo_smoke_test.js
 - scripts/optimize-image-schema.sql
 - scripts/reassign-properties.js
 - scripts/repo_audit.sh
 - scripts/run_migrations.sh
 - scripts/setup-seller-view.js
 - scripts/test-create-property.js
 - scripts/test-image-registration.js
 - scripts/upload-images-to-blob.js
 - scripts/verify-blob-urls.js
 - scripts/verify-properties.js

## Migrations

 - migrations/2025-10-26-create_property_documents.sql
 - migrations/2025-10-26-create_property_embeddings.sql
 - migrations/README.md

## Key libraries / helpers (src/lib)

 - src/lib/formatPropertyUtils.ts
 - src/lib/blob.ts
 - src/lib/envChecks.ts
 - src/lib/propertyImageUtils.ts
 - src/lib/mobileDetect.ts
 - src/lib/useMediaQuery.ts
 - src/lib/propertyUpdateEvents.ts
 - src/lib/useResolvedImage.ts
 - src/lib/cacheKeyBuilder.ts
 - src/lib/cacheOptimization.ts
 - src/lib/types.ts
 - src/lib/useCacheRefresh.ts
 - src/lib/logger.ts
 - src/lib/ratelimit.ts
 - src/lib/useImageUpload.ts
 - src/lib/cacheMetrics.ts
 - src/lib/cache.ts
 - src/lib/readModel.ts
 - src/lib/mongo.ts
 - src/lib/useWindowFocus.ts
 - src/lib/frontendCacheUtils.ts
 - src/lib/db.ts
 - src/lib/sessionCache.ts
 - src/lib/usePropertyWithImages.ts

## Env vars required for PoC (do NOT commit secrets)

Required env vars (create a local `.env.local` with these placeholders):

- DATABASE_URL           # Postgres canonical DB
- MONGODB_URI            # Vercel-managed MongoDB connection string
- MONGODB_DB             # Explicit Mongo DB name (required, do NOT use default 'test')
- VERCEL_REDIS_URL       # Vercel-managed Redis URL (or REDIS_URL)
- VERCEL_BLOB_TOKEN      # Vercel Blob token for signed uploads
- ADMIN_SECRET           # Protect sync/admin endpoints
- SAFE_TO_RUN (optional) # set true to allow destructive scripts without --confirm


## Notes / Next actions

 - Implement /api/sync-property to upsert denormalized read-model (Mongo) and invalidate cache.
 - Ensure your local `.env.local` sets `MONGODB_DB` to avoid using the default 'test' DB.
 - Use scripts/db_clean.js with --dry-run then --confirm when ready.
