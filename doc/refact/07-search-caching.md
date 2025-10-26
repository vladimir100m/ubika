# Step 07 — Search endpoint & caching

Purpose
- Provide a stable search endpoint using Postgres or Mongo read-model and add short-lived caching in Redis to improve PoC performance.

Actions
1. Implement `src/app/api/search/route.ts` accepting q, city, priceMin, priceMax, page, pageSize.
2. If `USE_MONGO_READMODEL=true`, use Mongo to query `property_documents`. Otherwise fall back to SQL.
3. Cache results in Redis with key `search:${hash(query+filters)}` and TTL 30–60s.
4. Handle pagination and return consistent shape for UI consumption.

Files to add/edit
- `src/app/api/search/route.ts`
- Update front-end search page to call this endpoint.

Example cache use
```js
const cacheKey = `search:${hash}`
const cached = await cache.get(cacheKey)
if (cached) return JSON.parse(cached)
const results = await queryDb(...)
await cache.set(cacheKey, JSON.stringify(results), { ttl: 60 })
return results
```

Acceptance criteria
- Search results returned and cached; TTL verified in dev flow.