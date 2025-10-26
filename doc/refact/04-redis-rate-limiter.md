# Step 04 — Vercel Redis wrapper & rate limiter

Purpose
- Provide a small Redis abstraction (VERCEL_REDIS_URL / REDIS_URL) and a simple rate limiter for serverless endpoints.

Actions
1. Add `src/lib/cache.ts`:
   - Initialize Redis client using `process.env.VERCEL_REDIS_URL || process.env.REDIS_URL`.
   - Expose async get/set/del JSON helpers and TTL helper.
2. Add `src/lib/ratelimit.ts`:
   - Implement token-bucket or sliding-window rate limiter using Redis INCR + EXPIRE.
   - API: rateLimit(key, limit, windowSeconds) -> { ok: boolean, remaining: number }
3. Replace direct uses of Redis in scripts (where practical) with the cache wrapper.

Example rate-limit logic
```js
// pseudo
const key = `ratelimit:${userId}`
const current = await redis.incr(key)
if (current === 1) await redis.expire(key, windowSeconds)
return { ok: current <= limit, remaining: Math.max(0, limit - current) }
```

Files to add
- `src/lib/cache.ts`
- `src/lib/ratelimit.ts`

Acceptance criteria
- Rate limiter prevents abusive requests in a unit-tested scenario.
- Cache wrapper used by at least one endpoint (sync or search) for TTL caching.