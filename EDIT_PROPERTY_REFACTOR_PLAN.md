# Edit Property Form Refactor - Plan

**File:** `src/ui/AddPropertyPopup.tsx`  
**Objective:** Ensure form has ALL property data model fields  
**Status:** ⏳ In Progress

---

## 📊 Current Form Fields vs Property Data Model

### ✅ Already in Form
- title
- description
- price
- address
- city
- state
- country
- zip_code
- type (property_type)
- bedrooms
- bathrooms
- sq_meters

### ❌ Missing from Form (Need to Add)
1. **year_built** - Construction year (optional)
2. **lat** - Latitude coordinate (optional)
3. **lng** - Longitude coordinate (optional)
4. **operation_status_id** - Buy/Rent status (1=Buy, 2=Rent)
5. **property_status_id** - Published/Draft status (optional)

---

## 🎯 Refactor Tasks

### 1. Add Missing Fields to FormData State
```typescript
formData: {
  // ... existing fields
  year_built: '',
  lat: '',
  lng: '',
  operation_status: '',  // 'buy' or 'rent'
  property_status: '',   // for future use
}
```

### 2. Add Missing Form Inputs
- **Year Built** (in Details section) - optional number input
- **Coordinates** (new Coordinates section) - lat/lng inputs
- **Operation Status** (in Basic section) - dropdown: Buy / Rent

### 3. Update Form Submission
```typescript
const propertyPayload = {
  // ... existing
  year_built: parseInt(formData.year_built) || null,
  lat: parseFloat(formData.lat) || null,
  lng: parseFloat(formData.lng) || null,
  // operation_status_id will be set based on operation_status
}
```

### 4. Keep Property Photo Section (No Changes)
✅ Already properly organized with:
- All Images Display
- Upload Area
- Set Cover Image functionality

---

## 📋 Form Structure (After Refactor)

```
1. Basic Information
   - Title *
   - Description
   - Type
   - Price *
   - Operation Status (Buy/Rent) ← NEW

2. Location
   - Address *
   - City *
   - State
   - Country
   - Zip Code

3. Property Details
   - Bedrooms
   - Bathrooms
   - Square Meters
   - Year Built ← NEW

4. Coordinates ← NEW SECTION
   - Latitude
   - Longitude

5. Property Photos ✅ (UNCHANGED)
   - All Images Display
   - Upload Area
   - Cover Image Management
```

---

## ✨ Benefits

✅ Complete form coverage of property data model  
✅ Users can specify buy/rent operation  
✅ Geo-coordinates can be set manually  
✅ Year built information captured  
✅ Better data accuracy  
✅ Photo management section untouched and working  

---

## Implementation Steps

1. [ ] Update FormData interface
2. [ ] Initialize form with missing fields from editingProperty
3. [ ] Add form inputs for missing fields
4. [ ] Add operation_status dropdown (Buy/Rent)
5. [ ] Update form submission to include all fields
6. [ ] Verify build passes
7. [ ] Test edit mode with all fields
8. [ ] Commit changes

