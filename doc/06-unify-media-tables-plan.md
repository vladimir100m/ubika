# Unification Plan: property_images → property_media

## Phase 1: Table Analysis

### Current Table Structures

#### `property_images` (14 columns, 10 rows)
**Purpose**: Store property images with image-specific metadata
**Primary Key**: `id` (SERIAL/INTEGER)
**Foreign Key**: `property_id` (UUID → properties.id, CASCADE)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | INTEGER | NO | nextval() | Unique identifier |
| property_id | UUID | NO | - | Reference to property |
| image_url | VARCHAR | NO | - | URL to image |
| storage_key | VARCHAR | YES | - | Key in blob storage |
| checksum | VARCHAR | YES | - | File integrity check |
| width | INTEGER | YES | - | Image width (pixels) |
| height | INTEGER | YES | - | Image height (pixels) |
| is_cover | BOOLEAN | YES | false | Mark as cover/thumbnail |
| display_order | INTEGER | YES | 0 | Ordering for gallery |
| mime_type | VARCHAR | YES | - | Content type (e.g., image/jpeg) |
| file_size | INTEGER | YES | - | Size in bytes |
| original_filename | VARCHAR | YES | - | Original file name |
| alt_text | TEXT | YES | - | Accessibility text |
| created_at | TIMESTAMP | YES | now() | Creation timestamp |
| updated_at | TIMESTAMP | YES | now() | Last update timestamp |

#### `property_media` (10 columns, 0 rows)
**Purpose**: Generic media storage (images, videos, documents, etc.)
**Primary Key**: `id` (UUID)
**Foreign Key**: `property_id` (UUID → properties.id, CASCADE)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Unique identifier |
| property_id | UUID | YES | - | Reference to property |
| media_type | VARCHAR | YES | - | Type: 'image', 'video', 'document', etc. |
| url | TEXT | NO | - | URL to media |
| storage_key | TEXT | YES | - | Key in blob storage |
| file_name | TEXT | YES | - | Original file name |
| file_size | INTEGER | YES | - | Size in bytes |
| mime_type | TEXT | YES | - | Content type |
| is_primary | BOOLEAN | YES | false | Mark as primary/cover |
| uploaded_at | TIMESTAMP | YES | now() | Upload timestamp |

### Key Differences & Conflicts

| Aspect | property_images | property_media | Resolution |
|--------|-----------------|----------------|-----------|
| ID Type | INTEGER (SERIAL) | UUID | Use UUID for unified table |
| ID Generation | SERIAL/nextval() | gen_random_uuid() | Use gen_random_uuid() |
| property_id Constraint | NOT NULL | NULL (optional) | Use NOT NULL |
| Cover Flag | is_cover (BOOLEAN) | is_primary (BOOLEAN) | Consolidate both → is_primary |
| Ordering | display_order (INTEGER) | - | Add display_order to unified table |
| Dimensions | width, height | - | Add to unified table |
| Alt Text | alt_text (TEXT) | - | Add to unified table |
| Timestamps | created_at, updated_at | uploaded_at only | Use all three: created_at, updated_at, uploaded_at |

### Image-Specific Fields
- `width`, `height` → For image dimensions
- `alt_text` → For accessibility
- `is_cover`, `display_order` → For gallery presentation
- `checksum` → For deduplication/integrity

---

## Phase 2: Unification Strategy

### Unified `property_media` Table Structure (11 columns)

```sql
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Media type and metadata
  media_type VARCHAR(50) DEFAULT 'image', -- 'image', 'video', 'document'
  url TEXT NOT NULL,
  storage_key TEXT,
  
  -- File information
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  checksum VARCHAR(256), -- For image deduplication
  
  -- Image-specific metadata
  width INTEGER,         -- NULL for non-images
  height INTEGER,        -- NULL for non-images
  alt_text TEXT,        -- Accessibility; NULL for non-images
  
  -- Presentation flags
  is_primary BOOLEAN DEFAULT FALSE, -- Cover/primary media
  display_order INTEGER DEFAULT 0,   -- Gallery ordering
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_property_id (property_id),
  INDEX idx_media_type (media_type),
  INDEX idx_is_primary (is_primary),
  INDEX idx_display_order (property_id, display_order)
);
```

### Default Behaviors
- **media_type**: Default to 'image' for existing property_images rows
- **is_primary**: Rename from both `is_cover` (images) and `is_primary` (media)
- **display_order**: Rename from images; default 0 for media
- **width, height, alt_text**: NULL for non-image media types
- **Timestamps**: Consolidate all three fields for complete audit trail

---

## Phase 3: Code Migration Strategy

### Step 3.1: Identify All Code References
Locations using `property_images` table:

1. **API Routes**:
   - `src/app/api/properties/images/route.ts` (GET, POST)
   - `src/app/api/properties/[id]/images/route.ts` (GET, POST, DELETE)
   - `src/app/api/properties/images/[id]/route.ts` (DELETE)
   - `src/app/api/properties/images/set-cover/route.ts` (POST)

2. **UI Components**:
   - `src/ui/PropertyImageCarousel.tsx`
   - `src/ui/PropertyImageEditor.tsx`
   - `src/ui/PropertyImageGrid.tsx`
   - `src/ui/PropertyGallery.tsx`
   - `src/ui/PropertyGalleryEnhanced.tsx`
   - `src/lib/useImageUpload.ts`
   - `src/lib/usePropertyWithImages.ts`

3. **Types**:
   - `src/types/index.ts` (PropertyImage interface)

4. **Utilities**:
   - `src/lib/propertyImageUtils.ts`
   - `src/lib/blob.ts`

### Step 3.2: Type Updates
Update `PropertyImage` interface → `PropertyMedia` interface with unified schema

### Step 3.3: API Endpoint Updates
Replace all `property_images` table queries with `property_media` table queries

### Step 3.4: UI Component Updates
Update to work with new table structure; support media_type filtering

### Step 3.5: Database Migration
Create migration script to:
1. Backup property_images data
2. Migrate data to property_media with media_type = 'image'
3. Drop property_images table
4. Validate row count and referential integrity

---

## Phase 4: Implementation Steps

### Step 1: Create Migration Script
- File: `scripts/migrate-images-to-media.js`
- Action: Migrate data from property_images → property_media
- Add media_type = 'image' for all migrated rows
- Map: is_cover → is_primary, display_order → display_order, etc.

### Step 2: Update Database Schema
- Add new columns to property_media (width, height, alt_text, display_order, checksum)
- Run migration to populate property_media from property_images
- Update indexes on property_media

### Step 3: Update TypeScript Types
- File: `src/types/index.ts`
- Replace PropertyImage with PropertyMedia
- Add media_type field
- Keep backward compatibility fields if needed

### Step 4: Update API Routes
- Replace all property_images SELECT/INSERT/UPDATE/DELETE with property_media
- Map field names: is_cover → is_primary, file_name ← original_filename
- Add media_type filter/default

### Step 5: Update UI Components
- Replace PropertyImage type references with PropertyMedia
- Update image fetching logic
- Add media_type awareness for future extensibility

### Step 6: Clean Up Legacy Code
- Remove old property_images references
- Delete property_images table after verification
- Update documentation

### Step 7: Testing & Validation
- Verify TypeScript compilation
- Test all image CRUD operations
- Verify property_media foreign key integrity
- Check cache invalidation patterns

---

## Phase 5: Rollback Plan

If issues arise:
1. Keep property_images table backup
2. Restore property_media from backup if needed
3. Revert API endpoints to read from property_images
4. Revert TypeScript types

---

## Benefits of Unification

✅ **Single Source of Truth**: One media table instead of two
✅ **Extensibility**: Support images, videos, documents through media_type
✅ **Cleaner API**: Unified `/api/properties/media` endpoint instead of `/api/properties/images`
✅ **Data Consistency**: Standardized UUID PKs, timestamps, naming
✅ **Future-Proof**: Easy to add non-image media support
✅ **Reduced Duplication**: No redundant schema across two tables

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Analyze Tables | 1 hour | ✅ Complete |
| Create Migration Script | 1 hour | ⏳ Next |
| Update Schema | 30 min | - |
| Update Types | 30 min | - |
| Update API Routes | 2 hours | - |
| Update UI Components | 1.5 hours | - |
| Testing & Cleanup | 1 hour | - |
| **Total** | **~7 hours** | - |

