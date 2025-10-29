# PropertyDetailCard Component - Visual Structure & Flow

---

## 🎨 Component Layout Diagram

```
PropertyDetailCard (Main Container)
│
├─ 1. HERO SECTION
│  ├─ Hero Header
│  │  ├─ Price & Status
│  │  │  ├─ Price (formatted): $450,000
│  │  │  ├─ Period indicator: /mo (if rental)
│  │  │  └─ Availability Badge: Available/Not Available
│  │  └─ PropertyActions (child component)
│  ├─ Title: "Modern Apartment in Recoleta"
│  └─ Location: "📍 Address • City • ZIP"
│
├─ 2. MAIN INFO SECTION
│  └─ Main Info Grid (3 cards)
│     ├─ Card 1: 🛏️ 2 Bedrooms
│     ├─ Card 2: 🚿 1 Bathrooms
│     └─ Card 3: 📐 85 m² Square Meters
│
├─ 3. HIGHLIGHTS SECTION ⚠️ COMMENTED
│  └─ Feature Tags (first 8)
│     ├─ Air Conditioning
│     ├─ Parking
│     └─ ... (up to 8)
│
├─ 4. DESCRIPTION SECTION
│  ├─ Heading: "📋 About This Property"
│  └─ Description text paragraph
│
├─ 5. DETAILS SECTION
│  └─ Collapsible Details
│     ├─ Interior Facts
│     │  ├─ Beds: 2
│     │  ├─ Baths: 1
│     │  ├─ Size: 85 m²
│     │  └─ Built: 2015
│     ├─ Property Facts
│     │  ├─ Type: Apartment
│     │  ├─ Status: Published
│     │  ├─ ZIP: 1425
│     │  └─ ID: 123456
│     ├─ Location Facts
│     │  ├─ Address
│     │  ├─ City
│     │  ├─ Latitude
│     │  └─ Longitude
│     └─ Listing Facts
│        ├─ Listed Date
│        ├─ Updated Date
│        └─ Seller ID
│
├─ 6. FEATURES SECTION ⚠️ PARTIALLY COMMENTED
│  └─ Features By Category
│     ├─ Interior Features
│     │  ├─ ✓ Air Conditioning
│     │  ├─ ✓ Hardwood Floors
│     │  └─ ✓ ...
│     ├─ Outdoor Features
│     │  ├─ ✓ Parking
│     │  ├─ ✓ Patio
│     │  └─ ✓ ...
│     └─ Amenities Features
│        ├─ ✓ Pool
│        ├─ ✓ Gym
│        └─ ✓ ...
│
├─ 7. LOCATION SECTION
│  ├─ Location Info
│  │  ├─ Address: "Av. 9 de Julio 1234"
│  │  ├─ City: "Buenos Aires"
│  │  ├─ ZIP: "1425"
│  │  └─ Coordinates: "-34.6037, -58.3816"
│  └─ Google Maps Iframe (embedded)
│
├─ 8. ADDITIONAL DETAILS SECTION
│  └─ Details Grid (2 columns)
│     ├─ Property Type: Apartment
│     ├─ Status: Available
│     ├─ Year Built: 2015
│     └─ Listed Date: Oct 15, 2025
│
└─ 9. CONTACT SECTION (if showContact = true)
   ├─ Section heading
   ├─ Contact subtext
   ├─ CTA Buttons
   │  ├─ 💬 Schedule Viewing
   │  └─ ❓ Ask Question
   └─ Agent Info
      ├─ Avatar: 🏢
      ├─ Name: "Ubika Real Estate"
      └─ Contact: "info@ubika.com • +1 (555) 123-4567"
```

---

## 📊 Data Flow Diagram

```
                    ┌─────────────────────┐
                    │  Property Object    │
                    │  (from params/DB)   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌───────────────┐ ┌────────────┐ ┌───────────────┐
        │ Image         │ │ Price &    │ │ Features &    │
        │ Processing    │ │ Status     │ │ Details       │
        │               │ │            │ │               │
        │ • Get cover   │ │ • Format   │ │ • Filter by   │
        │ • Resolve URL │ │   price    │ │   category    │
        │ • Set fallback│ │ • Determine│ │ • Group data  │
        └───────┬───────┘ │   availability
        │ • Check        └────────┬───────┘
        │   operation_status_id
        └────────────────┬────────┘
                         │
                    ┌────▼────────────────┐
                    │ Neighborhood Data   │
                    │ Fetch (useEffect)   │
                    └────────────────────┘
                         │
                    ┌────▼────────────────┐
                    │ Component State     │
                    ├────────────────────┤
                    │ • neighborhoodData  │
                    │ • imageError        │
                    │ • contactForm       │
                    │ • submitStatus      │
                    └────┬────────────────┘
                         │
                    ┌────▼────────────────────────┐
                    │ Render Component Sections   │
                    ├────────────────────────────┤
                    │ 1. Hero Section (Hero)     │
                    │ 2. Main Info (Stats)       │
                    │ 3. Highlights (Features)   │
                    │ 4. Description             │
                    │ 5. Details (Organized)     │
                    │ 6. Features (Categories)   │
                    │ 7. Location (Map)          │
                    │ 8. Additional Details      │
                    │ 9. Contact CTA             │
                    └────┬────────────────────────┘
                         │
                    ┌────▼─────────────────┐
                    │ Display to User      │
                    │ (Rich Property View) │
                    └──────────────────────┘
```

---

## 🔄 Component Lifecycle

```
MOUNT
  │
  ├─ Initialize State
  │  ├─ neighborhoodData = null
  │  ├─ loadingNeighborhood = true
  │  ├─ imageError = false
  │  ├─ contactForm = { name, email, phone, message }
  │  └─ submitStatus = 'idle'
  │
  ├─ Execute useEffect (dependency: [property.city])
  │  │
  │  ├─ if (property.city) {
  │  │    fetchNeighborhoodData()
  │  │      ├─ Build API URL
  │  │      ├─ Fetch from /api/neighborhoods
  │  │      ├─ setNeighborhoodData(result)
  │  │      └─ setLoadingNeighborhood(false)
  │  │  }
  │  └─ Return cleanup (optional)
  │
  └─ Render Component
      ├─ Process data (format price, availability, features)
      ├─ Render all 9 sections
      └─ Attach event handlers

UPDATE
  │
  ├─ property.city changed?
  │  └─ Fetch new neighborhood data
  │
  ├─ Form state changed?
  │  └─ Update contactForm state
  │
  └─ Re-render with new data

UNMOUNT
  │
  └─ Cleanup (if any)
```

---

## 🎯 State Management

```
propertyDetailCard Component State
│
├─ neighborhoodData: Neighborhood | null
│  └─ Data fetched from /api/neighborhoods
│     Contains: amenities, schools, transit, etc.
│
├─ loadingNeighborhood: boolean
│  └─ true while fetching
│  └─ false when complete
│
├─ imageError: boolean
│  └─ true if image fails to load
│  └─ used to show FALLBACK_IMAGE
│
├─ contactForm: {
│  │  name: string
│  │  email: string
│  │  phone: string
│  │  message: string
│  └─ Prepared but not submitted (logic not implemented)
│
└─ submitStatus: 'idle' | 'loading' | 'success' | 'error'
   └─ Used for contact form submission state
```

---

## 📦 Props & TypeScript Interfaces

```typescript
// Input Props
interface PropertyDetailCardProps {
  property: Property;        // Full property object
  showContact?: boolean;     // Default: true
}

// Main Info Item Type
interface MainInfoItem {
  icon: string;         // Emoji or icon
  label: string;        // Display label (e.g., "Bedrooms")
  value: string | number;  // Display value (e.g., 2)
}

// Feature Type (from property.features)
interface PropertyFeature {
  id: number;
  name: string;        // "Air Conditioning", "Parking", etc.
  category: string;    // "Interior", "Outdoor", or "Amenities"
  property_id: number;
}

// Property Type
interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  sq_meters: number;
  year_built: number;
  images?: Array<...>;
  features?: PropertyFeature[];
  lat: number;
  lng: number;
  property_type?: { display_name: string };
  property_status?: { display_name: string };
  operation_status_id?: number;
  created_at: string;
  updated_at: string;
}

// Neighborhood Type
interface Neighborhood {
  // Contains: amenities, schools, transit info, etc.
}
```

---

## 🔗 Dependency Graph

```
PropertyDetailCard
│
├─ Imports
│  ├─ React, useState, useEffect
│  ├─ Types (Property, Neighborhood)
│  ├─ CSS Module (PropertyDetailCard.module.css)
│  │
│  ├─ Utilities
│  │  ├─ getCoverImageRaw (image utilities)
│  │  ├─ getPropertyImagesRaw (image utilities)
│  │  ├─ formatPropertyPriceCompact (formatting)
│  │  ├─ formatPropertyDate (formatting)
│  │  ├─ formatPropertySize (formatting)
│  │  ├─ useResolvedImage (custom hook)
│  │  └─ FALLBACK_IMAGE constant
│  │
│  └─ Child Components
│     └─ PropertyActions (buttons for actions)
│
└─ External Dependencies
   ├─ Google Maps API (embedded iframe)
   └─ Neighborhood API (/api/neighborhoods)
```

---

## 🎨 CSS Classes Hierarchy

```
.propertyDetailCard (root)
│
├─ .heroSection
│  ├─ .heroHeader
│  ├─ .priceAndStatus
│  ├─ .heroPrice
│  ├─ .pricePeriod
│  ├─ .availabilityBadge
│  ├─ .availabilityDot
│  ├─ .heroTitle
│  ├─ .heroLocation
│  └─ .zipCode
│
├─ .mainInfoSection
│  └─ .mainInfoGrid
│     └─ .mainInfoCard (x3)
│        ├─ .mainInfoIcon
│        ├─ .mainInfoContent
│        ├─ .mainInfoValue
│        └─ .mainInfoLabel
│
├─ .highlightsSection (COMMENTED)
│  ├─ .sectionHeading
│  ├─ .highlightsTags
│  └─ .highlightTag
│
├─ .descriptionSection
│  ├─ .sectionHeading
│  └─ .descriptionText
│
├─ .section
│  ├─ .collapsibleHeader
│  ├─ .propertyTitle
│  ├─ .sectionBodyFade
│  └─ .propertyInfo
│     └─ .factsCategory (x4: Interior, Property, Location, Listing)
│        ├─ .categoryTitle
│        ├─ .infoGrid
│        └─ .infoItem
│           ├─ .infoLabel
│           └─ .infoValue
│
├─ .featuresSection
│  ├─ .sectionHeading
│  └─ .featuresCategoryGrid
│     └─ .featureCategory (x3: Interior, Outdoor, Amenities)
│        ├─ .featureCategoryTitle
│        ├─ .featureList
│        └─ li items with checkmarks
│
├─ .locationSection
│  ├─ .sectionHeading
│  ├─ .locationContent
│  ├─ .locationInfo
│  │  ├─ .locationItem
│  │  │  ├─ .locationLabel
│  │  │  └─ .locationValue
│  │  └─ .locationCoordinates
│  └─ .mapPlaceholder
│     └─ iframe (Google Maps)
│
├─ .additionalDetailsSection
│  ├─ .sectionHeading
│  └─ .detailsGrid
│     └─ .detailsGridItem (x4)
│        ├─ .detailsLabel
│        └─ .detailsValue
│
└─ .contactSection
   ├─ .sectionHeading
   ├─ .contactSubtext
   ├─ .contactCTA
   ├─ .ctaButtonPrimary
   ├─ .ctaButtonSecondary
   ├─ .agentInfo
   ├─ .agentAvatar
   ├─ .agentDetails
   ├─ .agentName
   └─ .agentContact
```

---

## 🚀 Performance Considerations

```
Component Optimization
│
├─ Memoization (not currently used, but ready)
│  └─ Could wrap with React.memo() for parent re-renders
│
├─ useCallback (not currently used)
│  └─ Could optimize event handlers
│
├─ useMemo (not currently used)
│  └─ Could memoize expensive computations
│
├─ Lazy Loading
│  └─ Google Maps iframe uses loading="lazy"
│
└─ Image Optimization
   ├─ Fallback image on load error
   ├─ Resolved image URLs (blob storage)
   └─ Cover image selection (best quality)
```

---

## ✅ Current Status

| Item | Status | Notes |
|------|--------|-------|
| Hero Section | ✅ Active | Price, availability, title |
| Main Info | ✅ Active | Beds, baths, size |
| Highlights | ⚠️ Disabled | Lines 129-142 commented |
| Description | ✅ Active | Text content |
| Details | ✅ Active | Organized facts |
| Features | ⚠️ Partial | Category lists commented |
| Location | ✅ Active | Maps embed working |
| Additional Details | ✅ Active | Summary grid |
| Contact | ✅ Ready | Form prepared, not submitted |

---

## 🎯 Summary

`PropertyDetailCard` is a **comprehensive, well-organized React component** that:

✅ Displays all property information in 9 distinct sections  
✅ Handles data processing and formatting  
✅ Fetches additional data (neighborhood info)  
✅ Provides responsive, professional UI  
✅ Integrates maps and external APIs  
✅ Prepares contact functionality  
✅ Uses TypeScript for type safety  
✅ Implements proper error handling  

**Status:** Production-ready with some sections prepared for future use (commented out).
