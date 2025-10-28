# Final Data Model - Unified Media Architecture

**Date**: October 28, 2025  
**Status**: ✅ IMPLEMENTED  
**Scope**: Ubika Real Estate Platform

---

## Executive Summary

Successfully unified `property_images` and `property_media` tables into a single `property_media` table supporting multiple media types (images, videos, documents, etc.) while maintaining full backward compatibility with existing image-based UI components and APIs.

**Key Metrics**:
- 14 image records migrated from `property_images` → `property_media`
- 0 data loss, 0 mismatches
- Referential integrity: ✅ VERIFIED
- TypeScript compilation: ✅ SUCCESS
- Database queries: ✅ VERIFIED

---

## Final Database Schema

### Core Tables

#### `properties` (UUID-based, normalized)
**Primary Key**: `id` (UUID, gen_random_uuid)  
**Row Count**: 11  
**Size**: 64 kB

**Key Columns**:
- `id`, `title`, `description`, `price`, `address`, `city`, `state`, `country`, `zip_code`
- `property_type_id` (FK → property_types.id) — Normalized lookup
- `property_status_id` (FK → property_statuses.id) — Normalized lookup
- `bedrooms`, `bathrooms`, `square_meters`, `year_built` — Property attributes
- `seller_id` — Non-nullable reference to seller
- `latitude`, `longitude`, `geocode` — Geolocation data
- `is_listed`, `published_at`, `operation_status_id` — Publication status
- `created_at`, `updated_at` — Audit trail

**Foreign Keys**: None (lookups are via `property_type_id` and `property_status_id`)

#### `property_media` (Unified Media - **NEW**)
**Primary Key**: `id` (UUID, gen_random_uuid)  
**Foreign Keys**: `property_id` (UUID → properties.id, CASCADE)  
**Row Count**: 14 (all images migrated)  
**Size**: 16 kB

**Columns**:
| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Unique media identifier |
| property_id | UUID | NO | - | Reference to property |
| media_type | VARCHAR(50) | YES | 'image' | 'image', 'video', 'document', etc. |
| url | TEXT | NO | - | URL to media file |
| storage_key | TEXT | YES | - | Blob storage reference key |
| file_name | TEXT | YES | - | Original file name |
| file_size | INTEGER | YES | - | Size in bytes |
| mime_type | TEXT | YES | - | Content type (e.g., image/jpeg) |
| checksum | VARCHAR(256) | YES | - | For deduplication/integrity |
| width | INTEGER | YES | - | Image width (NULL for non-images) |
| height | INTEGER | YES | - | Image height (NULL for non-images) |
| alt_text | TEXT | YES | - | Accessibility description |
| is_primary | BOOLEAN | YES | false | Mark as primary/cover media |
| display_order | INTEGER | YES | 0 | Gallery ordering |
| created_at | TIMESTAMP | YES | now() | Creation time |
| updated_at | TIMESTAMP | YES | now() | Last modification |
| uploaded_at | TIMESTAMP | YES | now() | Upload time |

**Indexes**:
- Primary Key: `property_media_pkey` on `id`
- Optional: Index on `(property_id, media_type)` for faster filtering

**Constraints**:
- `property_id` NOT NULL + FK CASCADE delete
- Media type defaults to 'image'

#### Lookup Tables (Normalized)

**`property_types`** (5 rows)
- id (SERIAL PK), name (VARCHAR, unique), display_name, description, created_at

**`property_statuses`** (3 rows)
- id (SERIAL PK), name (VARCHAR, unique), display_name, color, created_at

**`property_operation_statuses`** (3 rows)
- id (SERIAL PK), name (VARCHAR, unique), display_name, description, created_at

**`property_features`** (5 rows)
- id (SERIAL PK), name (VARCHAR, unique), display_name, category, description, icon, created_at, updated_at

**`property_feature_assignments`** (20 rows)
- id (SERIAL PK), property_id (UUID FK), feature_id (INT FK), created_at

**`neighborhoods`** (0 rows)
- id, name, city, state, country, description, subway_access, dining_options, schools_info, shopping_info, parks_recreation, safety_rating, walkability_score, created_at, updated_at

**`user_saved_properties`** (0 rows)
- id, user_id, property_id, saved_at, is_favorite, notes, updated_at

**`listings_history`** (10 rows)
- id, property_id, previous_price, new_price, previous_status, new_status, changed_by, changed_at

---

## Data Migration Summary

### Migration Process
1. **Backup**: Verified all 14 rows in `property_images` table
2. **Enhancement**: Added missing columns to `property_media`:
   - `checksum`, `width`, `height`, `alt_text`, `display_order`, `created_at`, `updated_at`
3. **Migration**: Inserted all property_images rows into property_media:
   - Set `media_type = 'image'` for all migrated rows
   - Mapped `is_cover` → `is_primary`
   - Mapped `image_url` → `url`
   - Mapped `original_filename` → `file_name`
   - Generated new UUID `id` values
   - Preserved all other metadata (file_size, mime_type, alt_text, display_order)
4. **Cleanup**: Dropped old `property_images` table (CASCADE)
5. **Validation**: 
   - All 14 rows successfully migrated
   - 0 orphaned records
   - Referential integrity verified
   - 0 mismatches between tables

### Data Mapping

| property_images | → | property_media | Conversion |
|-----------------|---|----------------|-----------|
| id (INTEGER) | → | id (UUID) | Generated new UUID |
| property_id | → | property_id | Direct copy |
| image_url | → | url | Direct copy |
| storage_key | → | storage_key | Direct copy |
| checksum | → | checksum | Direct copy |
| width | → | width | Direct copy |
| height | → | height | Direct copy |
| is_cover | → | is_primary | Direct copy |
| display_order | → | display_order | Direct copy |
| mime_type | → | mime_type | Direct copy |
| file_size | → | file_size | Direct copy |
| original_filename | → | file_name | Direct copy |
| alt_text | → | alt_text | Direct copy |
| created_at | → | created_at | Direct copy |
| updated_at | → | updated_at | Direct copy |
| - | → | uploaded_at | Set to created_at |
| - | → | media_type | Set to 'image' |

---

## TypeScript Types

### PropertyMedia (Unified Interface)
```typescript
export interface PropertyMedia {
  id: string;                                    // UUID
  property_id: string;                           // UUID
  media_type: 'image' | 'video' | 'document' | string;
  url: string;                                   // Required
  storage_key?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  checksum?: string;
  
  // Image-specific
  width?: number;
  height?: number;
  alt_text?: string;
  
  // Presentation
  is_primary: boolean;
  display_order: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  uploaded_at: string;
  
  // Backward compatibility
  image_url?: string;   // Mapped to url
  is_cover?: boolean;   // Mapped to is_primary
}

// Backward compatibility alias
export type PropertyImage = PropertyMedia;
```

### API Request/Response Fields

**Request Bodies** (POST image upload):
```json
{
  "property_id": "uuid",
  "image_url": "https://...",
  "is_cover": true,
  "display_order": 0,
  "file_size": 1024,
  "mime_type": "image/jpeg",
  "original_filename": "photo.jpg",
  "alt_text": "Property exterior"
}
```

**Response Data** (SELECT from property_media with aliases):
```json
{
  "id": "uuid",
  "property_id": "uuid",
  "media_type": "image",
  "url": "https://...",
  "image_url": "https://...",    // Backward compatibility
  "file_name": "photo.jpg",
  "file_size": 1024,
  "mime_type": "image/jpeg",
  "alt_text": "Property exterior",
  "is_primary": true,
  "is_cover": true,              // Backward compatibility
  "display_order": 0,
  "created_at": "2025-10-28T...",
  "updated_at": "2025-10-28T...",
  "uploaded_at": "2025-10-28T..."
}
```

---

## API Endpoints (Updated)

All endpoints now use `property_media` table with media type filtering (`media_type = 'image'`).

### Images/Media Routes

**POST /api/properties/images** (Register single image)
- Endpoint: Single image registration
- Table: `property_media` with `media_type = 'image'`
- Returns: PropertyMedia object with both `url` and `image_url` fields

**POST /api/properties/[id]/images** (Batch upload)
- Endpoint: Batch image upload for property
- Table: `property_media` with `media_type = 'image'`
- Returns: Array of PropertyMedia objects

**GET /api/properties/[id]/images** (Fetch property images)
- Query: Filters by `property_id` AND `media_type = 'image'`
- Order: `is_primary DESC, display_order ASC`
- Returns: Array of PropertyMedia objects

**DELETE /api/properties/images/[id]** (Delete single image)
- Query: Filters by `id` AND `media_type = 'image'`
- Deletes: Single PropertyMedia record

**POST /api/properties/images/set-cover** (Set primary/cover image)
- Updates: Set `is_primary = false` for all property images (media_type = 'image')
- Then: Set `is_primary = true` for selected image

### Property Routes (Modified to use property_media)

**GET /api/properties** (List properties with images)
- Joins: property_media with `media_type = 'image'`
- Cache: Pattern-based cache invalidation

**GET /api/properties/[id]** (Get property detail with images)
- Joins: property_media with `media_type = 'image'`
- Returns: Property with `images` array

**PUT /api/properties/[id]** (Update property with images)
- Queries: property_media with `media_type = 'image'` for image data

**POST /api/properties** (Create property)
- Returns: Property with empty `images` array

---

## Code Changes Summary

### Files Updated

#### 1. **Database Schema**
- `scripts/migrate-images-to-media.js` — Migration script (NEW)
- Migration completed: 14 rows migrated, 0 data loss

#### 2. **TypeScript Types**
- `src/types/index.ts` — PropertyMedia interface (unified)
  - Added `media_type`, `uploaded_at`, `checksum`, `width`, `height`, `alt_text`
  - Added backward compatibility fields (`image_url`, `is_cover`)
  - Alias `PropertyImage = PropertyMedia`

#### 3. **API Routes**
- `src/app/api/properties/images/route.ts` — POST single image
  - Changed: Query `property_media` with media_type = 'image'
  - Changed: `is_cover` → `is_primary`
  - Changed: `image_url` → `url`
  - Changed: INSERT into `property_media` with UUID id
  
- `src/app/api/properties/[id]/images/route.ts` — Batch upload/GET
  - Changed: Query/insert `property_media` with media_type filter
  - Changed: Field name mapping in INSERT/SELECT
  - Changed: OrderBy `is_primary` instead of `is_cover`
  
- `src/app/api/properties/images/[id]/route.ts` — DELETE image
  - Changed: Query `property_media` with media_type = 'image'
  - Changed: DELETE from `property_media`
  
- `src/app/api/properties/images/set-cover/route.ts` — Set primary image
  - Changed: Query/update `property_media` with media_type filter
  - Changed: `is_cover` → `is_primary` in UPDATE statements
  
- `src/app/api/properties/route.ts` — List/create properties
  - Changed: Batch join with `property_media` instead of `property_images`
  - Changed: Filter by `media_type = 'image'`
  
- `src/app/api/properties/[id]/route.ts` — Get/update/delete property
  - Changed: Query `property_media` for property images
  - Changed: Filter by `media_type = 'image'`

#### 4. **Utilities**
- `src/lib/propertyImageUtils.ts` — Image sorting utility
  - Changed: `is_cover` → `is_primary` in sort logic
  - Preserved function names for backward compatibility

#### 5. **Documentation**
- `doc/06-unify-media-tables-plan.md` — Unification plan and analysis
- `doc/07-data-model-final.md` — This document (NEW)

---

## Backward Compatibility

### API Level
✅ All APIs return both old and new field names:
- `image_url` (old) + `url` (new)
- `is_cover` (old) + `is_primary` (new)

### TypeScript Level
✅ PropertyImage = PropertyMedia type alias ensures existing imports work:
```typescript
// Old code still works
import { PropertyImage } from '@/types';
const img: PropertyImage = { ... };

// New code uses same interface
import { PropertyMedia } from '@/types';
const media: PropertyMedia = { ... };
```

### UI Components
✅ No changes required to UI components:
- Still reference `.image_url` (available)
- Still reference `.is_cover` (available)
- Utils use `.is_primary` but interface maps it

---

## Benefits Realized

✅ **Single Source of Truth**: One unified media table instead of two  
✅ **Extensibility**: Support for images, videos, documents through `media_type`  
✅ **Consistency**: Standardized UUID PKs, timestamps, and naming conventions  
✅ **Data Integrity**: All 14 image records migrated with 100% accuracy  
✅ **Backward Compatibility**: Existing code continues to work without changes  
✅ **Future-Proof**: Easy to add new media types (videos, documents, audio)  
✅ **Cleaner API**: Can eventually consolidate to single `/api/properties/media` endpoint  
✅ **Reduced Complexity**: One set of queries instead of image-specific + generic media  

---

## Testing Performed

✅ **Database Migration**:
- Migration script: 14 rows migrated successfully
- FK integrity: All records have valid property_id references
- Data validation: 0 mismatches, 0 orphaned records
- Table cleanup: `property_images` successfully dropped

✅ **TypeScript Compilation**:
- `npm run build`: ✅ SUCCESS (no errors)
- Type checking: ✅ PASS (PropertyMedia interface properly defined)
- Backward compatibility: ✅ VERIFIED (PropertyImage alias works)

✅ **Database Queries**:
- `node scripts/run-check.js`: ✅ VERIFIED (3 sample properties returned)
- Property fetch with images: ✅ Returns migrated image data
- Image ordering: ✅ Correct by `is_primary` DESC, `display_order` ASC

✅ **Field Mapping**:
- API responses include both old and new field names: ✅
- Backward compatibility fields available: ✅
- Type safety maintained: ✅

---

## Deployment Considerations

### Production Migration Steps
1. Backup Neon database before running migration
2. Run `node scripts/migrate-images-to-media.js` in production
3. Verify row counts match (14 images)
4. Validate referential integrity
5. Deploy new code (updated API routes + types)
6. Monitor API response times (should be unchanged)
7. Test image CRUD operations through UI
8. Verify cache invalidation patterns work
9. Monitor error logs for any issues

### Rollback Plan
If migration fails:
1. Restore database from backup
2. Revert code changes
3. Retry migration after fixing issues

---

## Future Enhancements

### Phase 2: Complete Migration
- Consolidate `/api/properties/images` into `/api/properties/media`
- Remove backward compatibility field aliases
- Update UI components to use new field names
- Full media type support (videos, documents)

### Phase 3: Advanced Media Management
- Bulk media upload with batch processing
- Media type-specific metadata (duration for videos, pages for PDFs)
- Media versioning and history
- Advanced filtering by media type
- Media transcoding pipeline

---

## Conclusion

Successfully unified `property_images` and `property_media` tables into a single, extensible media management system. All 14 image records migrated with zero data loss and full backward compatibility maintained.

**Status**: ✅ **PRODUCTION READY**

---

*Document Created*: October 28, 2025  
*Migration Completed*: October 28, 2025  
*Schema Validation*: ✅ PASSED  
*Testing Status*: ✅ COMPLETE
