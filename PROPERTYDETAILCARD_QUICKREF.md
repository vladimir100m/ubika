# PropertyDetailCard.tsx - Quick Reference Guide

**File:** `/Users/naranjax/project/ubika/src/ui/PropertyDetailCard.tsx`  
**Type:** Client Component (React)  
**Lines:** 399  
**Purpose:** Display comprehensive property details on property detail page  

---

## 🎯 One-Sentence Summary

A professional, multi-section React component that displays all property information (price, details, features, location, maps, contact) in a well-organized, responsive layout for property detail pages.

---

## 📋 What It Does

### 1. **Displays Property Information**
- Price and rental status
- Availability (Available/Not Available)
- Beds, baths, square meters
- Full property description
- Location details with Google Maps
- Contact information

### 2. **Processes Data**
- Resolves property images (handles fallbacks)
- Determines availability status
- Filters features by category (Interior/Outdoor/Amenities)
- Formats prices and dates
- Fetches neighborhood data from API

### 3. **Organizes Content** into 9 sections:
1. Hero section (price, title, location)
2. Main info (beds, baths, size)
3. Highlights (top features - commented)
4. Description
5. Details (organized facts)
6. Features (by category - partially commented)
7. Location (with embedded map)
8. Additional details (summary)
9. Contact CTA (if enabled)

---

## 🔧 Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Hero Section | ✅ Active | Price, status, title, location |
| Stats Grid | ✅ Active | Beds, baths, size in 3-column grid |
| Highlights | ⚠️ Disabled | Feature tags (commented) |
| Description | ✅ Active | Full property description |
| Details Grid | ✅ Active | 4 categories (Interior, Property, Location, Listing) |
| Features List | ⚠️ Disabled | Categories (Interior, Outdoor, Amenities - commented) |
| Google Maps | ✅ Active | Embedded iframe with coordinates |
| Contact Form | ✅ Ready | UI prepared, submission logic pending |
| Responsive | ✅ Active | Mobile, tablet, desktop support |

---

## 💾 Props

```typescript
interface PropertyDetailCardProps {
  property: Property;        // Required - Full property object
  showContact?: boolean;     // Optional - Show contact section (default: true)
}
```

### Example Usage
```tsx
<PropertyDetailCard 
  property={propertyData} 
  showContact={true}
/>
```

---

## 🎨 9 Component Sections

### 1️⃣ Hero Section
```
[Price $450,000] [Available Badge]
"Modern Apartment in Recoleta"
📍 Av. 9 de Julio 1234, Buenos Aires • 1425
```

### 2️⃣ Main Info Section
```
🛏️ 2 Bedrooms  |  🚿 1 Bathrooms  |  📐 85 m²
```

### 3️⃣ Highlights (Commented)
```
Feature tags: Air Conditioning | Parking | Pool | ...
```

### 4️⃣ Description
```
"About This Property"
Full description paragraph...
```

### 5️⃣ Details (Collapsible)
```
Interior: Beds, Baths, Size, Year Built
Property: Type, Status, ZIP, ID
Location: Address, Coordinates
Listing: Listed Date, Updated, Seller ID
```

### 6️⃣ Features by Category (Partially Commented)
```
Interior: ✓ Air Conditioning, ✓ Hardwood Floors, ...
Outdoor: ✓ Parking, ✓ Patio, ...
Amenities: ✓ Pool, ✓ Gym, ...
```

### 7️⃣ Location
```
Address, City, ZIP, Coordinates
[Google Maps Iframe]
```

### 8️⃣ Additional Details
```
4-column grid summary of key info
```

### 9️⃣ Contact CTA
```
"Interested in This Property?"
[💬 Schedule Viewing] [❓ Ask Question]
Ubika Real Estate - info@ubika.com
```

---

## 📊 State Management

```typescript
// 5 State Variables
const [neighborhoodData, setNeighborhoodData]           // API data
const [loadingNeighborhood, setLoadingNeighborhood]   // Loading flag
const [imageError, setImageError]                     // Image error flag
const [contactForm, setContactForm]                   // Contact form
const [submitStatus, setSubmitStatus]                 // Form submission status
```

---

## 🔄 Key Functions

### 1. **getFeaturesByCategory(category)**
```typescript
Filters features from property.features by category
Returns: Array of feature names
```

### 2. **fetchNeighborhoodData()** (in useEffect)
```typescript
Calls /api/neighborhoods
Passes: city, property_type
Returns: neighborhood info
```

### 3. **isAvailable** (computed)
```typescript
Checks if property_status.display_name !== 'not_available'
Used for: Availability badge styling
```

---

## 🔗 Dependencies

### Internal
- `PropertyActions` (child component)
- `useResolvedImage` (custom hook)

### Utilities
- `getCoverImageRaw`, `getPropertyImagesRaw`
- `formatPropertyPriceCompact`, `formatPropertyDate`, `formatPropertySize`
- `FALLBACK_IMAGE` constant

### Styling
- `PropertyDetailCard.module.css` (40+ classes)

### External APIs
- Google Maps (embed)
- `/api/neighborhoods` (fetch)

---

## 🎯 Used On

**Page:** `/property/[id]`  
**File:** `src/app/property/[id]/page.tsx`  
**Context:** Property detail page showing full information

---

## ⚠️ Known Issues / Notes

### 1. **Commented-Out Sections**
- Highlights section (lines 129-142)
- Indoor features (lines 194-203)
- Outdoor features (lines 205-214)
- Amenities features (lines 216-225)

**Reason:** These sections were replaced with different feature display structure.

### 2. **Contact Form**
- State prepared but **no submission logic implemented**
- Buttons exist but have no click handlers
- Ready for future development

### 3. **Neighborhood Data**
- Fetched from API but **not displayed** in UI
- Set up for future neighborhood info display

---

## ✅ CSS Classes Used (40+)

```
Hero: .heroSection, .heroHeader, .priceAndStatus, .heroPrice, 
      .pricePeriod, .availabilityBadge, .availabilityDot, 
      .heroTitle, .heroLocation, .zipCode

Main Info: .mainInfoSection, .mainInfoGrid, .mainInfoCard, 
           .mainInfoIcon, .mainInfoContent, .mainInfoValue, 
           .mainInfoLabel

Highlights: .highlightsSection, .highlightsTags, .highlightTag

Description: .descriptionSection, .descriptionText

Details: .section, .collapsibleHeader, .propertyTitle, 
         .sectionBodyFade, .propertyInfo, .factsCategory, 
         .categoryTitle, .infoGrid, .infoItem, .infoLabel, 
         .infoValue

Features: .featuresSection, .featuresCategoryGrid, 
          .featureCategory, .featureCategoryTitle, .featureList

Location: .locationSection, .locationContent, .locationInfo, 
          .locationItem, .locationLabel, .locationValue, 
          .locationCoordinates, .mapPlaceholder

Additional: .additionalDetailsSection, .detailsGrid, 
            .detailsGridItem, .detailsLabel, .detailsValue

Contact: .contactSection, .contactCTA, .ctaButtonPrimary, 
         .ctaButtonSecondary, .agentInfo, .agentAvatar, 
         .agentDetails, .agentName, .agentContact

Common: .sectionHeading, .contactSubtext
```

---

## 🚀 To Modify

### Enable Highlights Section
```tsx
// Line 129-142: Uncomment this block
{property.features && property.features.length > 0 && (
  <div className={styles.highlightsSection}>
    <h3 className={styles.sectionHeading}>✨ Highlights</h3>
    <div className={styles.highlightsTags}>
      {property.features.slice(0, 8).map((feature) => (
        <span key={feature.id} className={styles.highlightTag}>
          {feature.name}
        </span>
      ))}
    </div>
  </div>
)}
```

### Enable Features by Category
```tsx
// Lines 194-225: Uncomment the feature category blocks
{indoorFeatures.length > 0 && ( /* Indoor features */ )}
{outdoorFeatures.length > 0 && ( /* Outdoor features */ )}
{amenitiesFeatures.length > 0 && ( /* Amenities features */ )}
```

### Add Form Submission
```tsx
// Add onClick handler to buttons
// Implement API call to submit contact form
// Update submitStatus state
// Show success/error messages
```

---

## 📈 Performance

| Aspect | Status | Notes |
|--------|--------|-------|
| Rendering | ✅ Good | Clean component structure |
| Re-renders | ⚠️ Check | Could use React.memo() for optimization |
| Images | ✅ Good | Lazy loading, fallback handling |
| API Calls | ✅ Good | Single neighborhood fetch on mount |
| CSS | ✅ Good | CSS Modules (scoped styling) |

---

## 📚 Related Documentation

- **Full Analysis:** `PROPERTYDETAILCARD_ANALYSIS.md`
- **Visual Structure:** `PROPERTYDETAILCARD_STRUCTURE.md`
- **Styles:** `src/styles/PropertyDetailCard.module.css`
- **Database Schema:** `doc/00-data-model.md`
- **Component Usage:** `COMPONENT_USAGE_ANALYSIS.md`

---

## 🎯 Summary

| Aspect | Details |
|--------|---------|
| **What** | Comprehensive property detail display component |
| **Where** | Used on `/property/[id]` page |
| **Sections** | 9 organized sections (hero to contact) |
| **Data** | Displays all property info, features, location |
| **Features** | Responsive, maps, contact form (prepared) |
| **Status** | Production-ready, some sections optional |
| **Next Step** | Enable hidden sections or implement contact form |

---

## ✨ Key Takeaway

`PropertyDetailCard` is a **well-structured, professional React component** that transforms raw property data into a beautiful, information-rich user experience with proper error handling, API integration, and responsive design. It's designed to be maintainable, customizable, and production-ready.
