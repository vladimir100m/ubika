# Data model — v0.0.1 (2025-10-26)

Source & scope
- Source: live Neon DB configured in `.env.local` + app types in `src/types/index.ts` and SQL helper scripts.
- Scope: concise, production-minded view of the current schema and small improvements recommended for a real-estate product.

Design goals for improvements
- Normalize lookups (use FK integer ids) instead of free text for core enumerations (type, status).
- Use stable PKs (UUID) for public-facing entities (properties, media) and integer PKs for internal catalogs.
- Add explicit FK constraints, useful indexes, and audit timestamps. Keep geolocation typed and indexed for spatial queries.

Key tables (concise, improved for production)

properties
- PK: id UUID DEFAULT gen_random_uuid() NOT NULL
- Important columns (recommended types & constraints):
  - title TEXT NOT NULL
  - description TEXT
  - price NUMERIC(14,2) NOT NULL
  - currency CHAR(3) DEFAULT 'USD' NOT NULL
  - address TEXT
  - city TEXT, state TEXT, country TEXT, zip_code TEXT
  - property_type_id INTEGER REFERENCES property_types(id) -- prefer FK over free text
  - bedrooms INTEGER DEFAULT 0
  - bathrooms INTEGER DEFAULT 0
  - square_meters INTEGER DEFAULT 1
  - year_built INTEGER
  - seller_id TEXT NOT NULL REFERENCES users(id) /* nullable if external */
  - operation_status_id INTEGER REFERENCES property_operation_statuses(id)
  - property_status_id INTEGER REFERENCES property_statuses(id)
  - geocode JSONB NULL
  - latitude NUMERIC(9,6), longitude NUMERIC(9,6)
  - published_at TIMESTAMP WITH TIME ZONE NULL
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

property_images
- PK: id SERIAL
- Important columns:
  - property_id UUID REFERENCES properties(id) ON DELETE CASCADE
  - image_url VARCHAR(500) NOT NULL
  - blob_path VARCHAR(500) NULL
  - is_cover BOOLEAN DEFAULT false
  - display_order INTEGER DEFAULT 0
  - mime_type VARCHAR(100), file_size INTEGER, original_filename VARCHAR(255), alt_text TEXT
  - created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now()
- Indexes: (property_id), (property_id, is_cover DESC, display_order ASC), (property_id, display_order)

property_media
- PK: id UUID DEFAULT gen_random_uuid()
- Columns: property_id UUID, media_type TEXT, url TEXT, storage_key TEXT, file_name TEXT, file_size INTEGER, mime_type TEXT, is_primary BOOLEAN, uploaded_at TIMESTAMP

property_features (catalog)
- PK: id SERIAL
- Columns: name VARCHAR(100) NOT NULL, category VARCHAR(50) DEFAULT 'general', description TEXT, icon VARCHAR(50), created_at/updated_at

property_feature_assignments (join)
- PK: id SERIAL
- Columns: property_id UUID REFERENCES properties(id) ON DELETE CASCADE, feature_id INTEGER REFERENCES property_features(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT now()

property_types, property_statuses, property_operation_statuses
- Simple lookup tables with integer PK and display_name, color (for statuses), description and created_at.

neighborhoods
- PK: id SERIAL
- Columns: name, city, state, country, description, subway_access, dining_options, schools_info, shopping_info, parks_recreation, safety_rating INTEGER, walkability_score INTEGER, created_at/updated_at

user_saved_properties
- PK: id SERIAL
- Columns: user_id VARCHAR NOT NULL, property_id UUID REFERENCES properties(id), saved_at TIMESTAMP DEFAULT now(), is_favorite BOOLEAN DEFAULT false, notes TEXT, updated_at TIMESTAMP

Suggested production improvements (short)
- Add FK constraints for all implicit relations (property_type_id, property_status_id, seller_id if users table exists).
- Create partial indexes and GIN indexes:
  - GIN on `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))` for full-text search.
  - GiST or BRIN index on (latitude, longitude) or use PostGIS for spatial queries.
- Use NUMERIC(14,2) for price and store currency separately.
- Add `published_at`, `is_listed` boolean and `listed_by` user reference for listing lifecycle.
- Consider a `listings` history table to record price changes and status transitions.

Relationships (one-liners)
- properties 1—* property_images
- properties 1—* property_media
- properties *—* property_features via property_feature_assignments
- properties N—1 property_types, property_statuses, property_operation_statuses
- users 1—* user_saved_properties (if users table exists)

Indexes & perf notes
- Ensure indexes on foreign keys (property_id) and on ordering columns (display_order).
- Create full-text search GIN index for fast text search on title + description.
- Consider materialized views for aggregated feeds (e.g., latest listings per city) and cache common queries in Redis.

Source & how to reproduce
- The schema snapshot was read from the running Neon DB configured in `.env.local` and saved as `tmp/db_schema.json` using `scripts/db_list_schema.js`.

Next steps (optional)
- Produce CREATE TABLE DDL and FK constraints from `pg_catalog`.
- Generate a mermaid ER diagram.
- Add example API payloads for each resource (property, feature, image).

End of file

