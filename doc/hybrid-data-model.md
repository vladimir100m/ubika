---
title: "Hybrid Data Model"
version: v0.1.0
date: 2025-10-26
---

# Hybrid Data Model — v0.1.0 (2025-10-26)

> Hybrid architecture: SQL (authoritative) + NoSQL (read-optimized) + Redis (cache & pub/sub).

## Purpose & goals

- Keep transactional integrity for canonical data in SQL (Neon/Postgres).
- Provide fast reader experiences via denormalized NoSQL documents.
- Use Redis for low-latency cache and lightweight event pub/sub to drive sync workers.

## Where to store what (summary)

- **SQL (Neon/Postgres)**: canonical tables — properties, images, media, features, lookups, neighborhoods, user saves, histories.
- **NoSQL (MongoDB/DynamoDB)**: denormalized `property_documents` used by the frontend and search ingestion (embeds images, features, neighborhood summary, computed fields).
- **Redis**: short TTL caches (property:{id}, search:{query_hash}), pub/sub (`events:property_changes`), counters and rate-limiting keys.

## High-level flow (diagram)

```mermaid
flowchart TB
  subgraph App[App / API / Workers]
    A["Next.js App / API"]
    S["Search Service"]
  end

  SQL[(Neon / Postgres)]
  NoSQL[(MongoDB / DynamoDB)]
  R[(Redis)]
  W["Sync Worker"]

  A -->|writes| SQL
  A -->|reads (cache)| R
  R -->|miss -> read| NoSQL
  NoSQL -->|fallback| SQL
  A -->|publish event| R
  R -->|pub/sub| W
  W -->|upsert| NoSQL
  W -->|invalidate| R
  S -->|reads| NoSQL
  S -->|caches| R
```

## Notes on consistency

- All writes go to SQL first. Workers consume events and converge NoSQL and caches. Eventual consistency is acceptable for read pages; transactional flows (bookings) remain SQL-only.

## SQL snippets & indexes

See `tmp/db_schema.json` for a full column snapshot. The repo contains suggested DDL snippets (properties, images, features, lookups, neighborhoods, saved properties).

Key indexes to keep:
- `property_images(property_id)`, `(property_id,is_cover DESC, display_order ASC)`
- Full-text GIN on `to_tsvector(title || ' ' || description)`
- Spatial index (PostGIS / GiST) on location columns if geo queries matter

---

```sql
CREATE TABLE property_images (
  id SERIAL PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  blob_path VARCHAR(500),
  is_cover BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  mime_type VARCHAR(100),
  file_size INTEGER,
  original_filename VARCHAR(255),
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_cover_order ON property_images(property_id, is_cover DESC, display_order ASC);
```

-- property_features + assignments
```sql
CREATE TABLE property_features (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_feature_assignments (
  id SERIAL PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  feature_id INTEGER REFERENCES property_features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_feature_assign_property ON property_feature_assignments(property_id);
```

-- lookups
```sql
CREATE TABLE property_types (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, display_name VARCHAR(100), description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE property_statuses (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, display_name VARCHAR(100), description TEXT, color VARCHAR(20) DEFAULT '#000000', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE property_operation_statuses (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, display_name VARCHAR(100), description TEXT, created_at TIMESTAMPTZ DEFAULT now());
```

-- neighborhoods
```sql
CREATE TABLE neighborhoods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  description TEXT,
  subway_access TEXT,
  dining_options TEXT,
  schools_info TEXT,
  shopping_info TEXT,
  parks_recreation TEXT,
  safety_rating INTEGER,
  walkability_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

-- user_saved_properties (favorites)
```sql
CREATE TABLE user_saved_properties (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_saved_user ON user_saved_properties(user_id);
```


5) NoSQL data model (read-optimized documents)

Design intent
- Keep denormalized property documents used by the frontend for detail and list pages. Documents are updated by background workers on SQL changes.
- Use the NoSQL store for flexible, high throughput reads and easier horizontal scaling for search/feed traffic.

Collections and example documents

- `properties` collection — one document per property (copy of canonical SQL + embedded arrays)

Example (JSON)
```json
{
  "_id": "<uuid-of-property>",
  "title": "Charming 3BR in Brooklyn",
  "description": "...",
  "price": 650000.00,
  "currency": "USD",
  "address": "123 Example St",
  "city": "Brooklyn",
  "state": "NY",
  "zip_code": "11201",
  "property_type": { "id": 2, "name": "condo", "display_name": "Condo" },
  "bedrooms": 3,
  "bathrooms": 2,
  "square_meters": 120,
  "year_built": 2005,
  "features": [ { "id": 4, "name": "Swimming Pool" }, { "id": 7, "name": "Hardwood Floors" } ],
  "images": [ { "id": 123, "url": "/media/..", "is_cover": true }, {"id":124, "url":"/media/..."} ],
  "neighborhood": { "id": 5, "name": "Cobble Hill", "walkability_score": 93 },
  "computed": { "price_per_m2": 5416, "search_tags": ["pool","downtown"] },
  "published_at": "2025-10-01T12:00:00Z",
  "updated_at": "2025-10-21T09:12:34Z"
}
```

- `listings_feed` — time-ordered documents for feeds and recommendation, optionally partitioned by city or region for fast reads.
- `activity_events` — append-only events for analytics and ML (user clicks, saves, impressions).
- `users` — denormalized user profile and preferences used for personalization (optionally stored in SQL for auth, but cached/augmented in NoSQL).

Sync behaviour
- Worker reads SQL canonical data and builds or patches NoSQL documents (partial updates with $set/$unset) to minimize write amplification.
- Include `updated_at` to detect stale writes.


6) Redis: cache & coordination

What to cache
- property:{id} — serialized JSON of the property document (source: NoSQL or SQL on cache warm-up). TTL: 10–60 minutes depending on volatility.
- search:{query_hash} — paginated search results (array of property IDs or small documents). TTL: 30s–5m.
- autocomplete:{prefix} — top-k suggestions cached with TTL 1h.
- user:{id}:recent_views — small LRU lists (use Redis lists) for personalization.
- counters: impressions:{property_id} — increment-only counters, periodically flushed to analytics store.

Invalidation patterns
- After SQL write, publish property change event to Redis channel `events:property_changes` and include { id, action, version }
- Workers listening on that channel invalidate `property:{id}` and `search:*` keys affected (by tags/region). Optionally publish a `search_invalidate:{region}` channel.
- For critical updates (price change), consider synchronous cache invalidation before returning success.

Key naming examples
- property:{property_id}
- search:{city}:{filters_hash}
- autocomplete:{prefix}
- impressions:{property_id}
- user:{user_id}:saved

TTL recommendations
- Property doc cache: 10–60 minutes
- Search result cache: 30s–5 minutes
- Autocomplete: 1 hour

7) Operational notes
- Backfill strategy: build NoSQL documents from a full scan of SQL (`scripts/` contains helper scripts) and then switch to event-based sync.
- Migration strategy: add `updated_at` and `sync_version` to SQL rows to detect and reconcile missed events.
- Monitoring: track worker lag, Redis pub/sub queue size, and NoSQL write error rates.

8) Next steps (practical)
- Implement a background `sync-worker` that subscribes to `events:property_changes`, reads SQL, upserts NoSQL and invalidates Redis keys.
- Add a small `events` table in SQL for durable change-log in case pub/sub is lost.
- Generate ERD (mermaid) from `tmp/db_schema.json` and include in docs.

---

Document created: v0.1.0 — 2025-10-26
