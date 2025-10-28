# API Route Fixes — Database Schema Alignment

## Issues
Multiple API endpoints were returning **500 Internal Server Errors** due to querying legacy database columns that no longer exist after schema normalization:
1. **Image upload** — POST `/api/properties/images` failed during property verification
2. **Property update** — PUT `/api/properties/[id]` failed when attempting to update property with form data
3. **Property creation** — POST `/api/properties` failed when inserting new properties with legacy column names

### Root Cause
The API route handlers were still referencing legacy database columns removed during schema normalization:
- `p.room` → `p.bedrooms` (column renamed)
- `p.type` → lookup table `property_types` (column removed, now FK `property_type_id`)
- `p.status` → lookup table `property_statuses` (column removed, now FK `property_status_id`)
- `p.year_built` → `p.yearbuilt` (column name corrected)
- Direct INSERT attempting to write to non-existent columns

## Files Updated

### 1. `src/app/api/properties/images/route.ts` (POST — Image Registration)
**Line 77**: Fixed property verification query
- **Before**: `SELECT id, seller_id, city, operation_status_id, price, room as rooms FROM properties WHERE id = $1`
- **After**: `SELECT id, seller_id, city, operation_status_id, price, bedrooms as rooms FROM properties WHERE id = $1`

### 2. `src/app/api/properties/[id]/route.ts` (PUT — Property Update & DELETE)
**Lines 145–198**: Complete rewrite of field mapping logic
- **Before**: Blindly attempted to UPDATE any field passed in request body directly to DB (including `type`, `room`, `status` which don't exist)
- **After**: 
  - Maps legacy field names to normalized columns (e.g., `room` → `bedrooms`, `year_built` → `yearbuilt`)
  - Maintains allowlist of valid DB columns (`title`, `description`, `bedrooms`, `property_type_id`, `property_status_id`, etc.)
  - Skips legacy `type` and `status` when provided without corresponding ID fields (warns in logs)
  - Only updates columns that exist in the normalized schema

**Line 183–191**: Fixed PUT response query after update
- Joins to `property_types` and `property_statuses` tables instead of referencing legacy columns
- Uses `p.bedrooms as rooms`, `pt.name as property_type`, `ps.name as property_status`

**Line 270**: Fixed property ownership check query (DELETE handler)
- **Before**: `SELECT id, seller_id, city, operation_status_id, price, room as rooms FROM properties WHERE id = $1`
- **After**: `SELECT id, seller_id, city, operation_status_id, price, bedrooms as rooms FROM properties WHERE id = $1`

### 3. `src/app/api/properties/route.ts` (POST — Property Creation)
**Lines 256–327**: Complete rewrite of INSERT logic
- **Before**: Attempted INSERT into legacy columns (`type`, `room`, `status`) that don't exist; placeholder mismatch
- **After**:
  - Maps all incoming fields (legacy and new names) to normalized columns
  - Accepts both `bedrooms` and `room` (uses `bedrooms`)
  - Accepts both `sq_meters` and `square_meters` (uses `square_meters` in DB)
  - Accepts both `yearbuilt` and `year_built` (uses `yearbuilt`)
  - Inserts directly into `property_type_id`, `property_status_id` FK columns
  - Inserts into all available property columns including state, country, zip_code, geocode
  - Includes detailed logging of insert operation

### 4. `src/app/api/properties/images/set-cover/route.ts` (POST — Set Cover Image)
**Line 34**: Fixed property verification query
- **Before**: `SELECT id, seller_id, city, operation_status_id, price, room as rooms FROM properties WHERE id = $1`
- **After**: `SELECT id, seller_id, city, operation_status_id, price, bedrooms as rooms FROM properties WHERE id = $1`

## TypeScript Type Updates
Updated `src/types/index.ts` to support both legacy and new field names during migration:
- `id`: `string | number` (UUIDs from DB, numeric in legacy UI code)
- `squareMeters` and `sq_meters` both available (dual naming)
- `yearbuilt` and `year_built` both available (dual naming)
- `lat` and `lng`: `number | null` (nullable, matching DB schema where geocode can be NULL)
- `PropertyImage.id` and `property_id`: `string | number`

## Verification Results
- ✅ TypeScript compilation: `./node_modules/.bin/tsc --noEmit` — **No errors**
- ✅ Database query check: `node scripts/run-check.js` — **Returns 3+ sample properties with normalized schema**
- ✅ API route handlers: All legacy column references replaced with normalized joins and proper field mapping
- ✅ All three endpoints (POST create, PUT update, POST image upload) now use normalized schema

## Testing End-to-End
To verify all three fixes work together:
1. Start the app: `npm run dev`
2. **Test property creation**: Navigate to seller dashboard, create a new property (uses POST `/api/properties`)
3. **Test property update**: Edit the property, change details like bedrooms, price, property type (uses PUT `/api/properties/[id]`)
4. **Test image upload**: Upload images to the property (uses POST `/api/properties/images`)
5. Check browser console:
   - "🎉 All images uploaded successfully" 
   - No 500 errors in network tab
   - Property appears in seller dashboard with updated info

## Migration Status Summary
- **Completed**: 
  - ✅ All three API route endpoints migrated to normalized schema
  - ✅ TypeScript types updated to support UUIDs and nullable fields
  - ✅ All legacy column references removed from API handlers
  - ✅ Comprehensive logging added to INSERT and UPDATE operations
  - ✅ All tests passing (TypeScript compile + DB query verification)

- **Pending** (optional):
  - Remove `add-legacy-columns.js` script once confident app is fully using normalized schema
  - Convert scripts to idempotent migration SQL files for production rollouts
  - Add comprehensive e2e tests for property CRUD + image upload flow
  - Drop legacy columns once migration is complete and app is stable
