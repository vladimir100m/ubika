# Implemented schema & seeded mock data (local test)

Date: 2025-10-28

This document describes the schema created by `scripts/reset-and-seed.js` and the mock data inserted for local testing.

What the script does
- Drops existing app-related tables (destructive — only for local/test DBs).
- Creates the following tables with the described columns and constraints:
  - `property_types` (id SERIAL PK, name, display_name, description)
  - `property_statuses` (id SERIAL PK, name, display_name, color)
  - `property_operation_statuses` (id SERIAL PK, name, display_name)
  - `property_features` (id SERIAL PK, name, display_name, category, description, icon)
  - `neighborhoods` (id SERIAL PK, name, city, state, country, metadata...)
  - `properties` (id UUID PK DEFAULT gen_random_uuid(), title, description, price NUMERIC(14,2), currency CHAR(3), address, city, state, country, zip_code, property_type_id INTEGER, property_status_id INTEGER, operation_status_id INTEGER, bedrooms, bathrooms, square_meters, year_built, seller_id VARCHAR(255), geocode JSONB, latitude NUMERIC, longitude NUMERIC, published_at TIMESTAMPTZ, is_listed BOOLEAN, created_at, updated_at)
  - `property_images` (id SERIAL PK, property_id UUID FK -> properties.id, image metadata, storage_key, checksum, width, height)
  - `property_media` (id UUID PK, property_id UUID FK, url, storage_key, metadata)
  - `property_feature_assignments` (id SERIAL PK, property_id UUID FK, feature_id INTEGER FK)
  - `user_saved_properties` (id SERIAL PK, user_id, property_id UUID FK, saved_at, is_favorite, notes)
  - `listings_history` (id BIGSERIAL PK, property_id UUID FK, previous_price, new_price, previous_status, new_status, changed_by, changed_at)
  - `media_types` (id SERIAL PK, name, description, allowed_extensions TEXT[])

Mock data facts
- The script inserted a small set of lookup rows (property types, statuses, operation statuses, features).
- It created 10 mock `properties` for seller_id: `100296339400742202825` (the ID you requested). Each property has:
  - a generated UUID primary key
  - a single `property_images` row using `https://placehold.co/800x600` placeholder images
  - 2 assigned features
  - an initial `listings_history` entry

How to re-run
- Ensure `.env.local` contains `DATABASE_URL` pointing to your test DB.
- Run (script loads .env.local itself):

```bash
node scripts/reset-and-seed.js
```

Quick verification queries
- List properties for seller:

```sql
SELECT id, title, price, city, property_type_id, property_status_id, created_at
FROM properties
WHERE seller_id = '100296339400742202825'
ORDER BY created_at DESC;
```

- Count property images:

```sql
SELECT property_id, count(*) as images FROM property_images GROUP BY property_id;
```

- Show features for one property (replace <property_id>):

```sql
SELECT f.name
FROM property_features f
JOIN property_feature_assignments pfa ON pfa.feature_id = f.id
WHERE pfa.property_id = '<property_id>'
```

Notes & next steps
- This implementation is destructive and intended for local testing only. For a non-destructive production migration follow the phased plan in `doc/02-implementation-plan.md`.
- Update TypeScript types (`src/types/index.ts`) to reflect that `Property.id` is a string (UUID) and adjust any fields that changed.

End of file
