# Property Features Simulation Documentation

## Overview

The property features system is a database-driven feature management system that associates multiple features (amenities, characteristics) with properties. This document describes the database schema, relationships, and how features are simulated and used throughout the application.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Feature Catalog](#feature-catalog)
3. [Simulation Process](#simulation-process)
4. [Feature Assignment Logic](#feature-assignment-logic)
5. [API Integration](#api-integration)
6. [Components Using Features](#components-using-features)
7. [Troubleshooting](#troubleshooting)

---

## Database Schema

### Tables Overview

#### `property_features` Table

Stores the master list of all available features/amenities.

```sql
CREATE TABLE property_features (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,              -- Machine-readable name (snake_case)
  display_name VARCHAR(200),                      -- Human-readable name
  category VARCHAR(50) DEFAULT 'general',         -- Feature category: Interior, Outdoor, Amenities
  description TEXT,                               -- Optional description
  icon VARCHAR(50),                               -- Emoji or icon representation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Examples:**
```
id | name              | display_name              | category    | icon
---+-------------------+---------------------------+-------------+------
1  | air_conditioning  | Air Conditioning          | Interior    | ❄️
2  | parking           | Parking                   | Outdoor     | 🅿️
3  | pool              | Pool                      | Amenities   | 🏊
```

#### `property_feature_assignments` Table (Join Table)

Links properties to their assigned features (many-to-many relationship).

```sql
CREATE TABLE property_feature_assignments (
  id SERIAL PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  feature_id INTEGER REFERENCES property_features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Example:**
```
id | property_id                          | feature_id
---+--------------------------------------+------------
1  | 550e8400-e29b-41d4-a716-446655440001 | 1
2  | 550e8400-e29b-41d4-a716-446655440001 | 2
3  | 550e8400-e29b-41d4-a716-446655440001 | 3
```

### Relationship Diagram

```
┌──────────────────────┐           ┌────────────────────────┐
│    properties        │           │  property_features     │
├──────────────────────┤           ├────────────────────────┤
│ id (UUID) [PK]       │           │ id (INT) [PK]          │
│ title                │    ∞───1  │ name [UNIQUE]          │
│ bedrooms             │◄──────────│ display_name           │
│ bathrooms            │           │ category               │
│ square_meters        │           │ icon                   │
│ ...                  │           │ ...                    │
└──────────────────────┘           └────────────────────────┘
        ▲                                     ▲
        │                                     │
        └─────────────────┬───────────────────┘
                          │
                  (property_feature_assignments)
                          │
                ┌─────────┴──────────┐
                │  property_id (FK)  │
                │  feature_id (FK)   │
                └────────────────────┘
```

---

## Feature Catalog

### Categories & Features

#### Interior Features (13 features)
Amenities and features inside the property.

| Feature | Display Name | Icon |
|---------|--------------|------|
| air_conditioning | Air Conditioning | ❄️ |
| heating | Heating | 🔥 |
| washer | Washer | 🧺 |
| dryer | Dryer | 🌀 |
| dishwasher | Dishwasher | 🍽️ |
| microwave | Microwave | 🍳 |
| fireplace | Fireplace | 🔥 |
| hardwood_floors | Hardwood Floors | 🪵 |
| carpet | Carpet | 🟤 |
| tile_floors | Tile Floors | ⬜ |
| walk_in_closet | Walk-in Closet | 👔 |
| granite_counters | Granite Counters | ⚪ |
| stainless_appliances | Stainless Steel Appliances | 💎 |

#### Outdoor Features (10 features)
Outdoor spaces and parking amenities.

| Feature | Display Name | Icon |
|---------|--------------|------|
| balcony | Balcony | 🪟 |
| patio | Patio | 🪑 |
| garden | Garden | 🌳 |
| parking | Parking | 🅿️ |
| driveway | Driveway | 🛣️ |
| deck | Deck | 🌲 |
| yard | Yard | 🌿 |
| bbq_grill | BBQ Grill | 🔥 |
| outdoor_kitchen | Outdoor Kitchen | 👨‍🍳 |
| carport | Carport | 🚗 |

#### Amenities (14 features)
Building/complex amenities.

| Feature | Display Name | Icon |
|---------|--------------|------|
| pool | Pool | 🏊 |
| gym | Gym/Fitness Center | 💪 |
| elevator | Elevator | ⬆️ |
| security_system | Security System | 🔒 |
| doorman | Doorman | 🚪 |
| concierge | Concierge | 🎩 |
| rooftop | Rooftop | 🏢 |
| spa | Spa/Hot Tub | ♨️ |
| sauna | Sauna | 🧖 |
| community_center | Community Center | 🏘️ |
| parking_garage | Parking Garage | 🅿️ |
| storage | Storage | 📦 |

**Total: 37 unique features across 3 categories**

---

## Simulation Process

### Running the Feature Simulation Script

```bash
# Using dotenv to load environment variables
dotenv -e .env.local -- node scripts/simulate-features.js

# Or with npm/npx
npx dotenv -e .env.local -- node scripts/simulate-features.js
```

### What the Script Does

1. **Inserts Feature Catalog** (Step 1)
   - Adds all 37 features to `property_features` table
   - Uses `ON CONFLICT (name) DO NOTHING` to handle re-runs safely
   - Catalogs: Interior (13), Outdoor (10), Amenities (14)

2. **Fetches All Properties** (Step 2)
   - Queries all properties with their characteristics
   - Includes property type, bedrooms, bathrooms, square meters
   - Counts existing feature assignments

3. **Clears Old Assignments** (Step 3)
   - Removes all previous feature assignments
   - Allows re-running script without duplicates
   - Optional: Comment out to append instead

4. **Generates & Assigns Features** (Step 4)
   - Uses intelligent logic based on property characteristics
   - See [Feature Assignment Logic](#feature-assignment-logic) below
   - Inserts into `property_feature_assignments` join table

5. **Reports Statistics** (Step 5-6)
   - Total properties and features assigned
   - Feature distribution by category
   - Unique features used

### Example Output

```
================================================================================
PROPERTY FEATURES SIMULATION SCRIPT
================================================================================

📝 Step 1: Inserting feature catalog into property_features table...
✓ Features ready (30 new features added)

📊 Step 2: Fetching all existing properties...
✓ Found 11 properties

🔄 Step 3: Clearing existing feature assignments...
✓ Removed 20 old feature assignments

🎲 Step 4: Generating and assigning random features...
  ✓ Mock Property #10 (House) - 7 features assigned
  ✓ Mock Property #5 (House) - 7 features assigned
  ...

✓ Total feature assignments created: 66

📈 Step 5: Summary Statistics
  Total Properties: 11
  Properties with Features: 11
  Total Feature Assignments: 66
  Unique Features Used: 21

📋 Step 6: Feature Distribution by Category
  Amenities: 26 assignments
  Outdoor: 17 assignments
  Interior: 13 assignments

✅ Feature simulation completed successfully!
```

---

## Feature Assignment Logic

### Intelligent Feature Selection

The simulation script uses a hybrid approach combining:

1. **Property-Type Based Features**
2. **Property-Size Based Features**
3. **Random Features** for variety

### Assignment Rules

#### Universal Features (all properties)
- `parking` - Every property has parking
- `air_conditioning` - Universal comfort

#### By Property Type

**Studios/Apartments:**
- `elevator` - Common in multi-unit buildings
- `security_system` - Standard in apartment complexes
- 40% chance: `balcony` - Common in apartments

**Houses:**
- `driveway` - Typical for houses
- `yard` - Standard with houses
- 50% chance: `patio`
- 60% chance: `deck`

**Townhouses:**
- `patio` - Standard
- 40% chance: `yard`

#### By Size (Bathrooms ≥ 2)
- `granite_counters` - Luxury feature
- 50% chance: `walk_in_closet`

#### By Size (Bedrooms ≥ 3)
- `fireplace` - Larger homes
- 40% chance: `garden`

#### By Square Meters (>150m²)
- 50% chance: `spa` - Luxury amenity

#### Random Selection
- 1-3 additional random features per property
- Chosen from any category
- Avoids duplicates

### Algorithm Pseudocode

```javascript
function getRecommendedFeatures(propertyType, bedrooms, bathrooms, sqMeters) {
  features = []
  
  // Universal features
  features.push('parking', 'air_conditioning')
  
  // Type-specific
  if (type === 'apartment') {
    features.push('elevator', 'security_system')
    if (random > 0.4) features.push('balcony')
  }
  
  // Size-specific
  if (bathrooms >= 2) {
    features.push('granite_counters')
  }
  
  if (bedrooms >= 3) {
    features.push('fireplace')
  }
  
  // Random variety (1-3 features)
  for i in 1..random(1,3) {
    randomFeature = selectRandom(ALL_FEATURES)
    if not isDuplicate(randomFeature):
      features.push(randomFeature)
  
  return features
}
```

---

## API Integration

### Database Queries

#### Get Features for a Property

```sql
SELECT 
  pf.id,
  pf.name,
  pf.display_name,
  pf.category,
  pf.icon
FROM property_features pf
JOIN property_feature_assignments pfa ON pfa.feature_id = pf.id
WHERE pfa.property_id = $1
ORDER BY pf.category, pf.display_name;
```

#### Get Properties with Feature Count

```sql
SELECT 
  p.id,
  p.title,
  COUNT(pfa.id) as feature_count
FROM properties p
LEFT JOIN property_feature_assignments pfa ON p.id = pfa.property_id
GROUP BY p.id, p.title;
```

#### Get Feature Distribution

```sql
SELECT 
  pf.category,
  COUNT(*) as count
FROM property_feature_assignments pfa
JOIN property_features pf ON pfa.feature_id = pf.id
GROUP BY pf.category
ORDER BY count DESC;
```

### TypeScript Types

```typescript
// From src/types/index.ts
export interface PropertyFeature {
  id: number;
  name: string;              // Machine-readable: "air_conditioning"
  category?: string;         // Category: "Interior", "Outdoor", "Amenities"
  icon?: string;             // Icon emoji: "❄️"
  display_name?: string;     // Display: "Air Conditioning"
}

export interface Property {
  // ... other fields
  features: PropertyFeature[];  // Array of features for this property
}
```

---

## Components Using Features

### PropertyPopup Component

**File:** `src/ui/PropertyPopup.tsx`

#### Displays Features in Two Ways:

1. **"What's special" Tags Section** (Lines 370-382)
   - Shows first 10 features as uppercase tags
   - Quick visual scanning
   ```tsx
   {selectedProperty.features?.slice(0, 10).map((feature) => (
     <span key={feature.id}>{feature.name.toUpperCase()}</span>
   ))}
   ```

2. **"Features & Amenities" Organized by Category** (Lines 384-415)
   - Groups features by category (Interior, Outdoor, Amenities)
   - Uses utility function `getFeaturesByCategory()`
   - Displays with checkmarks and icons
   ```tsx
   {indoorFeatures.map((feature) => (
     <li key={idx}>✓ {feature}</li>
   ))}
   ```

### PropertyCard Component

**File:** `src/ui/PropertyCard.tsx`

#### Displays Features as Tags (Lines 163-172)
- Shows first 5 features (space-efficient for card view)
- Uses `feature.id` and `feature.name` from PropertyFeature object
- Card-optimized display
```tsx
{property.features?.slice(0, 5).map((feature) => (
  <span key={feature.id}>{feature.name}</span>
))}
```

### CSS Styling

**File:** `src/styles/PropertyPopup.module.css`

Key CSS classes for features:
- `.highlightsTags` - Container for feature tags
- `.highlightTag` - Individual tag styling
- `.featureCategory` - Category section
- `.featureList` - Feature list within category
- `.featureItem` - Individual feature with icon

---

## Usage Examples

### Adding Features to a New Property

```typescript
// When creating a property, also create feature assignments
const propertyId = newProperty.id;
const featureIds = [1, 3, 5]; // IDs from property_features table

for (const featureId of featureIds) {
  await db.query(
    `INSERT INTO property_feature_assignments (property_id, feature_id) 
     VALUES ($1, $2)`,
    [propertyId, featureId]
  );
}
```

### Fetching Property with Features

```typescript
// From property API endpoint
const property = await db.query(`
  SELECT 
    p.*,
    json_agg(json_build_object(
      'id', pf.id,
      'name', pf.name,
      'display_name', pf.display_name,
      'category', pf.category,
      'icon', pf.icon
    )) as features
  FROM properties p
  LEFT JOIN property_feature_assignments pfa ON p.id = pfa.property_id
  LEFT JOIN property_features pf ON pfa.feature_id = pf.id
  WHERE p.id = $1
  GROUP BY p.id
`, [propertyId]);
```

### Displaying Features

```tsx
// In React components
{property.features?.map((feature) => (
  <div key={feature.id} className={styles.featureTag}>
    <span>{feature.icon}</span>
    <span>{feature.display_name}</span>
  </div>
))}
```

---

## Troubleshooting

### Issue: Script reports "No properties found"

**Cause:** Database has no properties yet

**Solution:** Run the seed script first:
```bash
npx dotenv -e .env.local -- node scripts/reset-and-seed.js
```

### Issue: Features not appearing in frontend

**Solution:** Check two things:

1. **Features in database:**
   ```sql
   SELECT COUNT(*) FROM property_features;  -- Should be 37
   SELECT COUNT(*) FROM property_feature_assignments;  -- Should be > 0
   ```

2. **API returning features:**
   ```bash
   curl http://localhost:3000/api/properties/[id] | grep features
   ```

3. **Component receiving data:**
   - Add console.log in PropertyCard: `console.log('Features:', property.features)`
   - Check React DevTools component props

### Issue: Duplicate features for same property

**Cause:** Running script multiple times without clearing

**Solution:** Script automatically clears old assignments in Step 3
- Or manually clear:
  ```sql
  DELETE FROM property_feature_assignments;
  ```

### Issue: Feature categories not showing correctly

**Cause:** Category field mismatch (should be exact: "Interior", "Outdoor", "Amenities")

**Solution:** Check categories in property_features table:
```sql
SELECT DISTINCT category FROM property_features;
```

Should return exactly: "Interior", "Outdoor", "Amenities"

---

## Performance Considerations

### Query Optimization

For large property databases, consider:

1. **Add Index on Foreign Keys**
```sql
CREATE INDEX idx_pfa_property_id ON property_feature_assignments(property_id);
CREATE INDEX idx_pfa_feature_id ON property_feature_assignments(feature_id);
```

2. **Limit Features per Page**
```typescript
// In API: use LIMIT clause
features = property.features.slice(0, 10);  // Frontend: limit display
```

3. **Cache Feature Catalog**
```typescript
// Cache rarely-changing feature list
const FEATURE_CACHE = new Map();
if (!FEATURE_CACHE.has('all')) {
  FEATURE_CACHE.set('all', await fetchAllFeatures());
}
```

---

## Future Enhancements

1. **Feature Bundles** - Group related features (e.g., "Luxury Kitchen" = granite_counters + stainless_appliances)
2. **Feature Ratings** - Allow users to rate feature importance
3. **AI-Based Assignment** - Machine learning to suggest features based on similar properties
4. **Feature Search** - Filter properties by features
5. **Feature Analytics** - Track which features correlate with higher prices
6. **Localization** - Support multiple languages for feature display names

---

## Summary

The property features system provides:

- ✅ **Flexible schema** with many-to-many relationships
- ✅ **37 diverse features** across 3 categories
- ✅ **Intelligent simulation** script with property-aware logic
- ✅ **Component integration** in PropertyPopup and PropertyCard
- ✅ **Easy to extend** with new features and categories
- ✅ **Database-driven** for dynamic management

**Last Updated:** 2025-10-28  
**Script Location:** `/scripts/simulate-features.js`  
**Components:** PropertyPopup, PropertyCard
