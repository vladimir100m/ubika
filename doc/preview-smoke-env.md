Preview smoke script — required environment for Vercel preview

Set these environment variables in the Vercel preview project (or pass them when running the script):

- MONGODB_URI — Mongo connection string for the read-model (e.g. mongodb+srv://...)
- MONGODB_DB  — Mongo database name for the read-model (e.g. ubika_readmodel)
- REDIS_URL or VERCEL_REDIS_URL — Redis connection string used by cache
- DATABASE_URL — Postgres canonical DB (used by sync pipeline if running live)
- ADMIN_SECRET — admin secret used to protect the /api/sync-property endpoint

Optional (for the smoke script):
- PREVIEW_URL — URL of the preview deployment (defaults to http://localhost:3000)
- SMOKE_PROPERTY_ID — property id to POST to /api/sync-property (defaults to preview-smoke-prop-1)

How to run locally (example):

```bash
PREVIEW_URL=http://localhost:3000 ADMIN_SECRET=test-secret SMOKE_PROPERTY_ID=seed-prop-1 node scripts/preview-smoke.js
```

How to use in CI (example):

1. Set the listed envs in your Vercel preview's Environment Variables.
2. After deploy completes, run (replace preview-url):

```bash
PREVIEW_URL=https://preview-your-branch.vercel.app ADMIN_SECRET=$ADMIN_SECRET SMOKE_PROPERTY_ID=seed-prop-1 node scripts/preview-smoke.js
```

The script exits 0 on success and non-zero on failure. Critical checks are status 200 for both endpoints.
