# Neon Database Schema (ubika)

This document summarizes the database schema extracted from the project's Neon (Postgres) database. The metadata was exported from information_schema and saved to `docs/db_metadata/` (tables.csv, columns.csv, constraints.csv).

Generated: 2025-09-22

## Schemas

- neon_auth
- public

## Summary of tables

### neon_auth.users_sync
- Columns:
  - id (text) — PRIMARY KEY
  - raw_json (jsonb)
  - name (text)
  - email (text)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)
  - deleted_at (timestamp with time zone)

### public.media_types
- Columns:
  - id (integer) — SERIAL PRIMARY KEY
  - name (text) — UNIQUE
  - description (text)
  - allowed_extensions (ARRAY)

### public.neighborhoods
- Columns (notable):
  - id (integer) — PRIMARY KEY
  - name (varchar)
  - city (varchar)
  - state (varchar)
  - country (varchar)
  - description (text)
  - subway_access, dining_options, schools_info, shopping_info, parks_recreation (text)
  - safety_rating (integer)
  - walkability_score (integer)
  - created_at, updated_at (timestamps)

### public.properties
- Columns (notable):
  - id (uuid) — PRIMARY KEY
  - title (text)
  - description (text)
  - price (numeric)
  - address (text)
  - city/state/country/zip_code (text)
  - type (text)
  - room (integer)
  - bathrooms (integer)
  - status (text) — default 'available'
  - year_built (integer)
  - seller_id (text)
  - operation_status_id (integer) — FK to property_operation_statuses(id) (see constraints)
  - geocode (jsonb), latitude, longitude (numeric)
  - created_at, updated_at (timestamps)
  - square_meters (integer)

### public.property_feature_assignments
- Columns:
  - id (integer) — PRIMARY KEY
  - property_id (uuid) — FK -> properties(id)
  - feature_id (integer) — FK -> property_features(id)
  - created_at (timestamp)
  - UNIQUE(property_id, feature_id)

### public.property_features
- Columns:
  - id (integer) — PRIMARY KEY
  - name (varchar) — UNIQUE
  - category (varchar) — default 'general'
  - description (text)
  - icon (varchar)
  - created_at, updated_at (timestamps)

### public.property_images
- Columns:
  - id (integer) — PRIMARY KEY
  - property_id (uuid) — FK -> properties(id)
  - image_url (varchar)
  - is_cover (boolean) — default false
  - display_order (integer) — default 1
  - created_at, updated_at (timestamps)

### public.property_media
- Columns:
  - id (uuid) — PRIMARY KEY
  - property_id (uuid) — FK -> properties(id)
  - media_type (text)
  - url (text)
  - storage_key (text)
  - file_name, file_size, mime_type
  - is_primary (boolean) — default false
  - uploaded_at (timestamp)

### public.property_operation_statuses
- Columns:
  - id (integer) — PRIMARY KEY
  - name (varchar) — UNIQUE
  - display_name (varchar)
  - description (text)
  - created_at (timestamp)

### public.property_statuses
- Columns:
  - id (integer) — PRIMARY KEY
  - name (varchar) — UNIQUE
  - display_name (varchar)
  - description (text)
  - color (varchar) — default '#000000'
  - created_at (timestamp)

### public.property_types
- Columns:
  - id (integer) — PRIMARY KEY
  - name (varchar) — UNIQUE
  - display_name (varchar)
  - description (text)
  - created_at (timestamp)

### public.user_saved_properties
- Columns:
  - id (integer) — PRIMARY KEY
  - user_id (varchar) — not null
  - property_id (uuid) — FK -> properties(id)
  - saved_at (timestamp)
  - is_favorite (boolean) — default false
  - notes (text)
  - updated_at (timestamp)
  - UNIQUE(user_id, property_id)

## Constraints and relationships (extracted)

Primary keys: see tables above (pkey entries in constraints.csv).

Foreign keys found:
- property_feature_assignments.feature_id -> property_features.id
- property_feature_assignments.property_id -> properties.id
- property_images.property_id -> properties.id
- property_media.property_id -> properties.id
- property_media.media_type has a CHECK constraint (allowed values in table)
- user_saved_properties.property_id -> properties.id
- properties.operation_status_id -> property_operation_statuses.id (inferred from column and constraints)

Unique constraints:
- media_types.name
- property_features.name
- property_operation_statuses.name
- property_statuses.name
- property_types.name
- property_feature_assignments (property_id, feature_id)
- user_saved_properties (user_id, property_id)

Check constraints: multiple generated constraints (not-null checks and domain checks) are present. See `docs/db_metadata/constraints.csv` for full list.

## How to reproduce the metadata extraction locally

1. Ensure Docker is installed and running.
2. From the project root run (Makefile has a NEON_DB_URL):

   - Dump tables list:
     docker run --rm postgres:17 psql "$(NEON_DB_URL)" -c "\copy (SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name) TO STDOUT WITH CSV HEADER" > docs/db_metadata/tables.csv

   - Dump columns list:
     docker run --rm postgres:17 psql "$(NEON_DB_URL)" -c "\copy (SELECT table_schema, table_name, column_name, ordinal_position, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name, ordinal_position) TO STDOUT WITH CSV HEADER" > docs/db_metadata/columns.csv

   - Dump constraints:
     docker run --rm postgres:17 psql "$(NEON_DB_URL)" -c "\copy (SELECT tc.constraint_name, tc.constraint_type, tc.table_schema, tc.table_name, kcu.column_name, ccu.table_schema AS foreign_table_schema, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc LEFT JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema LEFT JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE tc.table_schema NOT IN ('pg_catalog','information_schema') ORDER BY tc.table_schema, tc.table_name) TO STDOUT WITH CSV HEADER" > docs/db_metadata/constraints.csv

3. Inspect the CSVs in `docs/db_metadata/` and update this markdown if required.

## Files created in this run

- docs/db_metadata/tables.csv — list of tables extracted from information_schema
- docs/db_metadata/columns.csv — list of columns and basic metadata
- docs/db_metadata/constraints.csv — constraints, PKs, FKs, unique and checks
- docs/NEON_SCHEMA.md — this file

## Notes and assumptions

- The Makefile included a Neon connection URL with credentials; I used that to connect via the official postgres docker image. If you'd prefer not to store credentials in the Makefile, consider moving them to an environment file or secrets manager and updating the Makefile to read from there.
- I limited the extraction to non-system schemas (excluded `pg_catalog` and `information_schema`). If you have other schemas that need documentation, run the queries adjusted accordingly.
- I inferred some relationships by matching column names and constraints in the exported CSVs; consult the raw CSVs for exact constraint names and definitions.

If you want, I can now: generate an ER diagram (DOT/SVG), expand column types with lengths/defaults, or add sample row counts for each table.
