# Proposed data model — v0.1 (2025-10-28) — adapted for local testing

This document lists the proposed/implemented model for local test usage. It reflects the schema that has already been created by `scripts/reset-and-seed.js` and includes guidance for destructive local testing.

Principles (local/test)
- Keep public entities as UUIDs (properties, media) as implemented.
- Keep small catalogs as integer SERIAL tables (property_types, property_statuses, property_features).
- Support a compatibility layer: short-lived legacy columns (`type`, `room`, `status`) are kept for local API compatibility; in production you'd remove them after migrating code.

Core changes implemented (summary)
- `properties`:
  - PK: id UUID DEFAULT gen_random_uuid()
  - Columns: title, description, price NUMERIC(14,2), currency CHAR(3), address, city/state/country/zip_code, property_type_id INTEGER, property_status_id INTEGER, operation_status_id INTEGER, bedrooms, bathrooms, square_meters, year_built, seller_id VARCHAR, geocode JSONB, latitude NUMERIC, longitude NUMERIC, published_at TIMESTAMPTZ, is_listed BOOLEAN, created_at, updated_at
  - Compatibility columns (also present for local testing): `type` TEXT, `room` INTEGER, `status` TEXT (backfilled from lookups/bedrooms)

- `property_images`: id SERIAL, property_id UUID FK -> properties(id), image_url, storage_key, checksum, width, height, is_cover, display_order, mime_type, file_size, original_filename, alt_text, created_at, updated_at

- `property_media`: id UUID, property_id UUID FK, media_type, url, storage_key, file_name, file_size, mime_type, is_primary, uploaded_at

- Lookup catalogs: `property_types`, `property_statuses`, `property_operation_statuses`, `property_features` (SERIAL PKs)

- Join tables and history: `property_feature_assignments`, `user_saved_properties`, `listings_history`

Notes on local testing vs production
- For local tests we keep legacy columns (`type`,`room`,`status`) and provide a compatibility migration `scripts/add-legacy-columns.js` that creates and backfills them. This allows existing API SQL (which still references `p.type`, `p.room`, `p.status`) to continue working in the local environment.
- In a production migration you should:
  1. Add the new FK columns and lookup tables (additive).
  2. Backfill lookup rows and map IDs.
  3. Update application code to use FK columns.
  4. Remove legacy columns once code no longer depends on them.

Indexes & perf (local guidance)
- Full-text and spatial indexes still recommended for production, but are optional for local testing.

Destructive operations allowed for local test
- `scripts/reset-and-seed.js` is intentionally destructive: it drops and recreates tables and seeds mock data.
- If you want to completely drop tables without recreating, use the `scripts/drop-all-tables.js` helper (provided) with `--confirm` to avoid accidents.

End of file
-- 1) Lookup tables (id serial)
CREATE TABLE IF NOT EXISTS property_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  color VARCHAR(20) DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Add columns to properties (additive)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_type_id INTEGER;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_status_id INTEGER;

ALTER TABLE properties
  ALTER COLUMN price TYPE NUMERIC(14,2) USING price::numeric;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'USD';

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT false;

-- 3) Add FK constraints in a second step (after backfill)
ALTER TABLE properties
  ADD CONSTRAINT fk_properties_property_type FOREIGN KEY (property_type_id) REFERENCES property_types(id) ON UPDATE CASCADE;

ALTER TABLE properties
  ADD CONSTRAINT fk_properties_property_status FOREIGN KEY (property_status_id) REFERENCES property_statuses(id) ON UPDATE CASCADE;

-- 4) Images improvements
ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS storage_key VARCHAR(1000);

ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS checksum VARCHAR(128);

ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS width INTEGER;

ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS height INTEGER;

-- 5) Listings history
CREATE TABLE IF NOT EXISTS listings_history (
  id BIGSERIAL PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  previous_price NUMERIC(14,2),
  new_price NUMERIC(14,2),
  previous_status INTEGER,
  new_status INTEGER,
  changed_by VARCHAR(255),
  changed_at TIMESTAMPTZ DEFAULT now()
);

Indexes & performance
- Create GIN index for full-text search on (title || description).
- Create BRIN or GiST index for latitude/longitude depending on expected query patterns.
- Index frequently queried columns: (city), (property_type_id), (property_status_id), (price).

Data migration notes
- Plan backfill from existing free-text values into `property_types` / `property_statuses` before adding FK constraints.
- Update application code to write to both new FK columns and old text columns during transitional period.
- Once backfill verified, add NOT NULL or drop old free-text columns.

Compatibility
- TypeScript types must be updated: change Property.id to string and property_type/property_status to reference the lookup shapes.

End of file
