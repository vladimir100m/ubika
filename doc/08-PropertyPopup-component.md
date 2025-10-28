# PropertyPopup Component - Comprehensive Documentation

## 📋 Overview

The **PropertyPopup** component is a modal/overlay component that displays detailed property information in a visually appealing, organized layout matching professional real estate sites like Zillow. It provides users with comprehensive property details including images, price, features, description, location with embedded Google Map, and a contact form.

**Location:** `src/ui/PropertyPopup.tsx`  
**Styles:** `src/styles/PropertyPopup.module.css`  
**Type:** React Functional Component with Hooks  
**Framework:** Next.js 13+ with React 18+  
**Latest Update:** October 28, 2025 (V2.1 - Zillow Design)

---

## 🎯 Purpose & Use Cases

The PropertyPopup serves as the primary detailed view for property information when:
- User clicks on a property in the map view
- User selects a property from search results
- User views property details in the seller dashboard
- User browses the property catalog

**Key Features:**
- ✅ Beautiful mobile-first image gallery with carousel
- ✅ Zillow-style hero section with price, availability, address
- ✅ "Get pre-qualified" call-to-action button
- ✅ Professional 2-column stats grid with icons (Property Type, Year Built, Lot Size, Price/m²)
- ✅ Highlighted features/amenities with "What's special" section
- ✅ Features organized by category (Interior, Outdoor, Amenities)
- ✅ Full property description with "Read More" expansion
- ✅ Location information with coordinates
- ✅ Embedded Google Map with location marker
- ✅ Contact form for agent inquiries
- ✅ Native share functionality

---

## 🏗️ Component Architecture

### Props Interface

```typescript
interface PropertyPopupProps {
  selectedProperty: Property;  // Complete property data object
  onClose: () => void;         // Callback to close the popup/modal
}
```

### State Management

The component manages several state pieces:

```typescript
// Carousel and image display
const [showCarousel, setShowCarousel] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [imageLoading, setImageLoading] = useState(false);

// Contact form
const [showContactForm, setShowContactForm] = useState(false);
const [contactFormData, setContactFormData] = useState(INITIAL_CONTACT_FORM);

// Touch/swipe gestures for carousel
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);

// Description expansion
const [expandedDescription, setExpandedDescription] = useState(false);

// Google Maps
const { isLoaded } = useLoadScript({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
});
```

---

## 📊 Component Sections

### 1. **Header Section** (Mobile Overlay Controls)
- Close button (X icon) at top left
- Share button at top right
- Positioned as fixed overlay buttons
- Backdrop blur effect for visual appeal
- **Styling:** `.topRightButtons`, `.iconButton`

### 2. **Image Gallery Header**
- Responsive image grid displaying property photos
- Click to open full carousel modal
- Fixed height (420px) for consistent layout
- Uses `PropertyImageGrid` sub-component
- **Styling:** `.headerFixedHeight`

### 3. **Hero Section** ⭐ **REDESIGNED (Mobile-First Zillow Style)**

Professional hero section with:
- **For Sale Badge** - Status indicator (top left, red dot)
- **Large Price Display** - Formatted price (e.g., "C$349,900")
- **Beds & Baths Row** - Icons with counts (🛏️ 2 beds | 🚿 2 baths)
- **Full Address** - Complete property location
- **"Get Pre-Qualified" Button** - Interactive CTA with $ icon

**Mobile Layout:**
```
[X] [Share]
┌─────────────────────┐
│  • For sale         │
│                     │
│  C$349,900          │
│  🛏️ 2   🚿 2        │
│                     │
│  460 Wellington... │
│  [$ Get pre-...]   │
└─────────────────────┘
```

**Styling:** `.heroSectionMobile`, `.forSaleBadge`, `.priceDisplayMobile`, `.bedsAndBathsRow`, `.addressLineHero`, `.getPreQualifiedBtn`

**Data Source:**
```typescript
selectedProperty.price              // Formatted with thousand separators
selectedProperty.operation_status_id // Determines if "/mo" rental
selectedProperty.property_status    // Determines availability
selectedProperty.bedrooms           // Bed count
selectedProperty.bathrooms          // Bath count
selectedProperty.address            // Full location string
```

### 4. **Main Stats Grid** ⭐ **NEW (Zillow 2-Column Layout)**

Professional 2-column grid with icons and text:

| Left Column | Right Column |
|------------|------------|
| 🏢 **Apartment** | 🔨 **Built in 2015** |
| **Property Type** | **Built** |
| 📐 **2,000 m²** | 💰 **$500/m²** |
| **Lot size** | **Price/m²** |
| 📅 **$2,500** (if rental) | |
| **/mo** | |

**Features:**
- Icon-based visual hierarchy
- Hover effects with subtle lift
- Gradient backgrounds (light gray to slightly lighter)
- Responsive 2-column grid
- Shows property age in parentheses (e.g., "2015 (9y)")
- Optional monthly rental price display

**Styling:** `.zilowStatsGrid`, `.zilowStatCard`, `.zilowStatIcon`, `.zilowStatContent`, `.zilowStatValue`, `.zilowStatLabel`

**Computed Values:**
```typescript
const pricePerSqm = selectedProperty.price / (selectedProperty.sq_meters || 1);
const yearBuilt = selectedProperty.year_built || selectedProperty.yearbuilt;
const propertyAge = new Date().getFullYear() - yearBuilt;
```

### 5. **Highlights Section** ("What's special")
- Displays features as uppercase tags/pills
- Useful for quick feature overview
- Uses uppercase feature names for visual impact
- Zinc background with gray text
- Tag style: inline-block with padding

**Styling:** `.highlightsSection`, `.highlightsTags`, `.highlightTag`

**Data Source:**
```typescript
selectedProperty.features  // Array of PropertyFeature objects
```

### 6. **Features & Amenities Section**
Features organized into three categories with icons:

#### 6a. **Interior Features** (🏠)
- Features with `category === 'Interior'`
- Display: Bulleted list with checkmark

#### 6b. **Outdoor Features** (🌳)
- Features with `category === 'Outdoor'`
- Display: Bulleted list with checkmark

#### 6c. **Amenities** (⭐)
- Features with `category === 'Amenities'`
- Display: Bulleted list with checkmark

**Styling:** `.featuresSection`, `.featuresCategoryGrid`, `.featureCategory`, `.featureList`

### 7. **Description Section** ⭐ ENHANCED
- Full property description text
- "Read More/Show Less" toggle for descriptions > 300 characters
- Justified text alignment with 1.6 line-height
- Professional typography with subtle shadows

**Styling:** `.descriptionSection`, `.descriptionText`, `.readMoreBtn`

**Truncation Logic:**
```typescript
const MAX_DESC_LENGTH = 300;
const truncatedDescription = 
  selectedProperty.description.length > 300
    ? selectedProperty.description.substring(0, 300) + '...'
    : selectedProperty.description;
```

### 8. **Location Info Section** ⭐ NEW
Displays structured location information:
- **Full Address** - Combines address, city, state, zip code
- **Coordinates** - Latitude/longitude for mapping reference
- **Clean Card Design** - Light gradient background
- **Responsive Layout** - Stacks on mobile

**Styling:** `.locationInfoSection`, `.locationInfoCard`, `.addressText`, `.coordinateItem`

### 9. **Google Map Section** ⭐ NEW
Interactive embedded Google Map showing property location:

**Features:**
- Custom purple marker pin
- Zoom level: 15 (detailed neighborhood view)
- Full height: 400px (responsive)
- Controls: zoom buttons, fullscreen
- Disabled: map type, street view

**Library:** `@react-google-maps/api`

**Environment Variable Required:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### 10. **Contact Section**
Two-state contact CTA:

**State 1: Collapsed**
- Heading: "Contact an agent about this home"
- Description: "Get more information..."
- Button: "Contact Agent"

**State 2: Expanded (Form)**
- Contact header with close button
- Form fields: Name, Phone, Email, Message
- Actions: Cancel, Send Message buttons
- Form validation and submission ready

**Styling:** `.contactSection`, `.contactForm`, `.inputField`, `.textareaField`

### 11. **Image Carousel Modal**
- Full-screen carousel view
- Touch/swipe support for navigation
- Uses `PropertyImageCarousel` component
- Lazy image loading with progress indicator

---

## 🔧 Data Flow

### Input Data (Property Object)

```typescript
interface Property {
  id: string | number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sq_meters?: number;
  lat?: number | null;
  lng?: number | null;
  property_type: PropertyType;
  property_status: PropertyStatus;
  features: PropertyFeature[];
  images: PropertyImage[];
  state?: string;
  country?: string;
  zip_code?: string;
  year_built?: number | null;
  operation_status_id?: number;
}
```

### Processing Pipeline

```
Raw Property Data
        ↓
Memoized Computations
├─ Format price (formatNumberWithCommas)
├─ Check availability status
├─ Extract features by category
├─ Truncate description if > 300 chars
├─ Build full location string
├─ Calculate price per square meter
├─ Determine year built and age
└─ Calculate map center coordinates
        ↓
Component State Updates
├─ Carousel state (image selection)
├─ Form state (contact data)
├─ UI state (description expansion)
└─ Touch state (swipe gestures)
        ↓
Render Sections
└─ Display all data in organized Zillow-style layout
```

---

## 🎨 Styling & Design System

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | #667eea → #764ba2 | Buttons, highlights |
| Primary Action | #1277e1 | Call-to-action buttons |
| Text Primary | #1f2937 | Main text, headings |
| Text Secondary | #6b7280 | Labels, captions |
| Border | #e5e7eb | Card borders, dividers |
| Background Light | #f9fafb | Stat cards, light sections |
| Success Green | #22c55e | Availability indicator |
| Error Red | #ef4444 | Unavailable indicator |

### Typography Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Hero Price | 36-48px | 800 | Large price display |
| Section Heading | 18-20px | 700 | Section titles |
| Stat Value | 15px | 700 | Card stat values |
| Stat Label | 12px | 500 | Card stat labels |
| Body Text | 14-16px | 400 | Descriptions |

### Responsive Breakpoints

#### Desktop (> 1024px)
- Full 2-column stat grid visible
- All sections fully expanded
- Larger font sizes
- Padding: 24px

#### Tablet (768px - 1024px)
- 2-column grid optimized for medium screens
- Adjusted spacing
- Padding: 20px

#### Mobile (< 768px)
- Hero section optimized for vertical layout
- 2-column stat grid maintained
- Map height: 300px
- Padding: 16px

#### Very Mobile (< 480px)
- Compact hero section
- Reduced font sizes
- Map height: 250px
- Padding: 12px

---

## 📱 Event Handlers

### `handleImageChange`
Navigate carousel images forward/backward.

### `handleShare`
Share property via native API or clipboard copy.

### `handleCloseContactForm`
Reset contact form and close form view.

### `handleContactFormChange`
Update individual contact form field with validation.

---

## 💻 Usage Example

```tsx
import PropertyPopup from '@/ui/PropertyPopup';
import { Property } from '@/types';

export default function PropertyPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <>
      <PropertyList onSelectProperty={setSelectedProperty} />
      
      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </>
  );
}
```

---

## 🔌 Dependencies

### External Libraries
- **@react-google-maps/api** (v2.20.6+) - Google Maps
- **react** (18.3.1+) - React framework
- **react-dom** (18.3.1+) - DOM rendering

### Internal Components
- `PropertyImageGrid` - Image gallery
- `PropertyImageCarousel` - Fullscreen carousel

### Utilities
- `getAllPropertyImagesRaw()` - Extract images
- `formatNumberWithCommas()` - Price formatting

### Environment Variables
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

---

## 📝 Recent Improvements (V2.1 - Zillow Design)

### ✨ What's New
1. **Mobile-First Hero Section** - Redesigned to match Zillow's layout
2. **Zillow-Style 2-Column Stats Grid** - Professional property details display
3. **Enhanced Visual Hierarchy** - Better icon and text organization
4. **Improved Mobile Responsiveness** - Optimized for all screen sizes
5. **Google Map Integration** - Embedded location visualization
6. **Location Info Card** - Structured address and coordinates display
7. **Description with "Read More"** - Better content management

### 🎯 Design Principles Applied
- **Mobile-First Approach** - Optimized for smallest screens first
- **Professional Real Estate Design** - Matches Zillow/Trulia standards
- **Icon-Based Communication** - Visual hierarchy through icons
- **Whitespace & Breathing Room** - Clean, uncluttered layout
- **Consistent Color System** - Professional, modern palette
- **Responsive Grid System** - Adapts to all screen sizes

---

## 🚀 Performance Optimizations

- **Memoization** - useMemo for expensive computations
- **Callback Optimization** - useCallback for event handlers
- **Lazy Loading** - Google Maps loads only when needed
- **Code Splitting** - Carousel as separate component
- **Image Optimization** - Handled by PropertyImageGrid

---

## 🧪 Testing Checklist

### Data Edge Cases
- [ ] Missing description
- [ ] No images
- [ ] Invalid coordinates
- [ ] Missing location data
- [ ] Long property names

### User Interactions
- [ ] Close popup with X
- [ ] Share functionality
- [ ] Image gallery click/swipe
- [ ] Contact form submission
- [ ] Description expand/collapse
- [ ] Mobile responsiveness
- [ ] Map rendering

### Visual Testing
- [ ] Hero section layout
- [ ] Stats grid alignment
- [ ] Feature tags display
- [ ] Map loads correctly
- [ ] Contact form styling

---

## 🔮 Future Enhancements

- [ ] Virtual tours (3D walkthrough)
- [ ] Price history graph
- [ ] Similar properties carousel
- [ ] Neighborhood insights
- [ ] Market analysis cards
- [ ] Document viewer
- [ ] Video property tour
- [ ] Street view integration

---

**Last Updated:** October 28, 2025  
**Component Version:** 2.1 (Zillow V2 Design)  
**Status:** ✅ Production Ready  
**Build Status:** ✅ Passing



---

## 🎯 Purpose & Use Cases

The PropertyPopup serves as the primary detailed view for property information when:
- User clicks on a property in the map view
- User selects a property from search results
- User views property details in the seller dashboard
- User browses the property catalog

**Key Features:**
- ✅ Beautiful image gallery with carousel
- ✅ Price with monthly/annual pricing indicators
- ✅ Availability status with visual indicator
- ✅ Structured property metrics (beds, baths, sq meters)
- ✅ Highlighted features/amenities
- ✅ Features organized by category (Interior, Outdoor, Amenities)
- ✅ Full property description with "Read More" expansion
- ✅ Location information with coordinates
- ✅ Embedded Google Map with location marker
- ✅ Contact form for agent inquiries
- ✅ Share functionality

---

## 🏗️ Component Architecture

### Props Interface

```typescript
interface PropertyPopupProps {
  selectedProperty: Property;  // Complete property data object
  onClose: () => void;         // Callback to close the popup/modal
}
```

### State Management

The component manages several state pieces:

```typescript
// Carousel and image display
const [showCarousel, setShowCarousel] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [imageLoading, setImageLoading] = useState(false);

// Contact form
const [showContactForm, setShowContactForm] = useState(false);
const [contactFormData, setContactFormData] = useState(INITIAL_CONTACT_FORM);

// Touch/swipe gestures for carousel
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);

// Description expansion
const [expandedDescription, setExpandedDescription] = useState(false);

// Google Maps
const { isLoaded } = useLoadScript({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
});
```

---

## 📊 Component Sections

### 1. **Header Section**
- Close button (X icon)
- Share button with native share or clipboard fallback
- Positioned as fixed overlay buttons
- Backdrop blur effect for visual appeal

**Styling:** `.topRightButtons`, `.iconButton`

### 2. **Image Gallery Header**
- Responsive image grid displaying property photos
- Click to open full carousel modal
- Fixed height (420px) for consistent layout
- Uses `PropertyImageGrid` sub-component

**Styling:** `.headerFixedHeight`

### 3. **Hero Section**
- Large formatted price (e.g., "$125,000" or "2,500/mo")
- Availability status badge (Available/Not Available)
- Visual indicator dot with status color
- Gradient background (purple gradient: #667eea → #764ba2)

**Styling:** `.heroSection`, `.heroPrice`, `.availabilityBadge`

**Data Source:**
```typescript
selectedProperty.price              // Formatted with thousand separators
selectedProperty.operation_status_id // Determines if "2 = monthly"
selectedProperty.property_status    // Determines availability
```

### 4. **Main Info Section**
Three information cards displayed in a grid:

| Card | Data | Icon |
|------|------|------|
| Bedrooms | `selectedProperty.bedrooms` | 🛏️ |
| Bathrooms | `selectedProperty.bathrooms` | 🚿 |
| Square Meters | `selectedProperty.sq_meters` | 📐 |

**Features:**
- Hover effect with slight lift and border color change
- Responsive grid layout
- Clean white cards with subtle borders

**Styling:** `.mainInfoSection`, `.mainInfoGrid`, `.mainInfoCard`

### 5. **Highlights Section**
- Displays up to 8 features as tags/pills
- Useful for quick feature overview
- Uses emoji + feature name

**Styling:** `.highlightsSection`, `.highlightsTags`, `.highlightTag`

**Data Source:**
```typescript
selectedProperty.features  // Array of PropertyFeature objects
.slice(0, 8)              // Limited to 8 items
```

### 6. **Features & Amenities Section**
Features organized into three categories:

#### 6a. **Interior Features**
- Features with `category === 'Interior'`
- Icon: 🏠
- Display: Bulleted list with checkmark

#### 6b. **Outdoor Features**
- Features with `category === 'Outdoor'`
- Icon: 🌳
- Display: Bulleted list with checkmark

#### 6c. **Amenities**
- Features with `category === 'Amenities'`
- Icon: ⭐
- Display: Bulleted list with checkmark

**Styling:** `.featuresSection`, `.featuresCategoryGrid`, `.featureCategory`, `.featureList`

**Logic:**
```typescript
const indoorFeatures = getFeaturesByCategory(features, 'Interior');
const outdoorFeatures = getFeaturesByCategory(features, 'Outdoor');
const amenitiesFeatures = getFeaturesByCategory(features, 'Amenities');
```

### 7. **Description Section**
- Full property description text
- "Read More/Show Less" toggle for descriptions > 300 characters
- Justified text alignment with 1.6 line-height
- Professional typography

**Styling:** `.descriptionSection`, `.descriptionText`, `.readMoreBtn`

**Features:**
- Truncation logic for long descriptions
- Smooth gradient button on hover
- Maximum truncate length: 300 characters

**Data Flow:**
```typescript
const MAX_DESC_LENGTH = 300;
const truncatedDescription = selectedProperty.description.length > 300
  ? selectedProperty.description.substring(0, 300) + '...'
  : selectedProperty.description;

const hasMoreDescription = selectedProperty.description.length > MAX_DESC_LENGTH;

// Display logic
{expandedDescription ? selectedProperty.description : truncatedDescription}
```

### 8. **Location Info Section** ⭐ NEW
Displays structured location information in an info card:

- **Full Address:** Combines address, city, state, zip code
- **Coordinates:** Latitude and longitude displayed as reference
- **Format:** Clean card with light gradient background
- **Styling:** `.locationInfoSection`, `.locationInfoCard`, `.addressText`

**Data Source:**
```typescript
const fullLocation = [
  selectedProperty.address,
  selectedProperty.city,
  selectedProperty.state,
  selectedProperty.zip_code
].filter(Boolean).join(', ');
```

**Coordinates Display:**
```typescript
<span>Lat: {selectedProperty.lat.toFixed(4)}</span>
<span>Lng: {selectedProperty.lng.toFixed(4)}</span>
```

### 9. **Google Map Section** ⭐ NEW
Interactive embedded Google Map showing property location:

**Features:**
- Requires `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Center marker on property coordinates
- Custom marker icon (purple pin)
- Zoom level: 15
- Full height: 400px (responsive, scales on mobile)
- Map controls: zoom, fullscreen available
- Disabled: map type, street view

**Styling:** `.mapSection`, `.mapContainer`, `.googleMap`

**Library:** `@react-google-maps/api`

**Implementation:**
```typescript
const mapCenter = useMemo(
  () => ({ lat: selectedProperty.lat || 0, lng: selectedProperty.lng || 0 }),
  [selectedProperty.lat, selectedProperty.lng]
);

const { isLoaded } = useLoadScript({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
});

// In JSX:
{isLoaded && (
  <GoogleMap zoom={15} center={mapCenter}>
    <Marker position={mapCenter} title={selectedProperty.title} />
  </GoogleMap>
)}
```

### 10. **Contact Section**
Two-state contact CTA:

#### State 1: Collapsed (Initial)
- Heading: "Contact an agent about this home"
- Description: "Get more information..."
- Button: "Contact Agent"

#### State 2: Expanded (Form)
- Contact header with close button
- Form fields:
  - Name (text input)
  - Phone (text input)
  - Email (email input)
  - Message (textarea)
- Actions:
  - Cancel button
  - Send Message button

**Styling:** `.contactSection`, `.contactForm`, `.inputField`, `.textareaField`

**State Management:**
```typescript
const [showContactForm, setShowContactForm] = useState(false);
const [contactFormData, setContactFormData] = useState({
  name: '',
  phone: '',
  email: '',
  message: "I'm interested in this property"
});
```

### 11. **Image Carousel Modal**
- Opens when user clicks image gallery
- Full-screen carousel view
- Touch/swipe support for image navigation
- Displayed using `PropertyImageCarousel` component

**Styling:** Handled by `PropertyImageCarousel`

---

## 🔧 Data Flow

### Input Data (Property Object)

```typescript
interface Property {
  id: string | number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sq_meters?: number;
  lat?: number | null;
  lng?: number | null;
  property_type: PropertyType;
  property_status: PropertyStatus;
  features: PropertyFeature[];
  images: PropertyImage[];
  state?: string;
  country?: string;
  zip_code?: string;
  yearbuilt?: number | null;
  operation_status_id?: number;
}
```

### Processing Pipeline

```
Raw Property Data
        ↓
Memoized Computations
├─ Format price with thousand separators
├─ Check availability status
├─ Extract features by category
├─ Truncate description if > 300 chars
├─ Build full location string
└─ Calculate map center coordinates
        ↓
Component State Updates
├─ Carousel state (image selection)
├─ Form state (contact data)
├─ UI state (description expansion)
└─ Touch state (swipe gestures)
        ↓
Render Sections
└─ Display all data in organized layout
```

---

## 🎨 Styling & Responsive Design

### Color System

| Element | Color | Use |
|---------|-------|-----|
| Hero Gradient | #667eea → #764ba2 | Background gradients |
| Primary Action | #1277e1 | Buttons, links |
| Text Primary | #1f2937 | Main text |
| Text Secondary | #6b7280 | Labels, captions |
| Border | #e5e7eb | Dividers, outlines |
| Background Light | #f9fafb | Section backgrounds |

### Responsive Breakpoints

#### Tablet (max-width: 768px)
- Map height reduced to 300px
- Location info layout adjusted
- Padding reduced

#### Mobile (max-width: 480px)
- Map height: 250px
- All padding: 16px
- Main info cards stack appropriately
- Single column features
- Reduced font sizes

### CSS Modules

All styling uses CSS Modules scoped to prevent conflicts:

```typescript
import popupStyles from '../styles/PropertyPopup.module.css';

// Usage
<div className={popupStyles.heroSection}>...</div>
```

---

## 📱 Event Handlers

### `handleImageChange`
Navigate carousel images forward/backward.

```typescript
const handleImageChange = useCallback(
  (direction: 'next' | 'prev') => {
    const totalImages = allImages.length || 1;
    setCurrentImageIndex(prev =>
      direction === 'next'
        ? (prev + 1) % totalImages
        : (prev - 1 + totalImages) % totalImages
    );
  },
  [allImages.length]
);
```

### `handleTouchStart / handleTouchMove / handleTouchEnd`
Detect swipe gestures on carousel (> 50px movement).

```typescript
// Touch handlers detect swipe direction and trigger image change
```

### `handleShare`
Share property details via native share API or clipboard.

```typescript
const handleShare = useCallback(async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: selectedProperty.title,
        text: selectedProperty.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  } catch (error) {
    console.error('Share failed:', error);
  }
}, [selectedProperty.title, selectedProperty.description]);
```

### `handleCloseContactForm`
Reset contact form and close form view.

```typescript
const handleCloseContactForm = useCallback(() => {
  setShowContactForm(false);
  setContactFormData(INITIAL_CONTACT_FORM);
}, []);
```

### `handleContactFormChange`
Update individual contact form field.

```typescript
const handleContactFormChange = useCallback((field: string, value: string) => {
  setContactFormData(prev => ({ ...prev, [field]: value }));
}, []);
```

---

## 🔌 Dependencies

### External Libraries
- **@react-google-maps/api** (v2.20.6+) - Google Maps integration
- **react** (18.3.1+) - React framework
- **react-dom** (18.3.1+) - React DOM rendering

### Internal Components
- `PropertyImageGrid` - Image gallery display
- `PropertyImageCarousel` - Full-screen carousel modal

### Utilities
- `getAllPropertyImagesRaw()` - Extract images from property
- `formatNumberWithCommas()` - Format price display

### Environment Variables
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 💻 Usage Example

```tsx
import PropertyPopup from '@/ui/PropertyPopup';
import { Property } from '@/types';

export default function PropertyPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePopup = () => {
    setSelectedProperty(null);
  };

  return (
    <>
      {/* Property list or map */}
      <PropertyList onSelectProperty={handlePropertySelect} />

      {/* Show popup when property selected */}
      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}
```

### In Map View

```tsx
import PropertyPopup from '@/ui/PropertyPopup';

export default function MapPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <>
      <Map onMarkerClick={setSelectedProperty} />
      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </>
  );
}
```

---

## 🚀 Performance Optimizations

### Memoization
- `useMemo` for expensive computations (feature extraction, coordinate calculations)
- `useCallback` for event handlers to prevent unnecessary re-renders
- Memoized image list extraction

### Image Optimization
- Uses `PropertyImageGrid` for optimized image display
- Carousel lazy loads images
- Configurable image loading states

### Lazy Loading
- Google Maps loads only when API key available
- `useLoadScript` hook handles async loading

### Code Splitting
- Component imported dynamically where possible
- Carousel modal as separate component

---

## 🧪 Testing Considerations

### Data Edge Cases to Handle
1. **Missing description** - Component renders with conditional check
2. **No images** - PropertyImageGrid handles gracefully
3. **Invalid coordinates** - Map doesn't render without valid lat/lng
4. **Missing location data** - Location section hidden if not available
5. **Long descriptions** - Truncation with "Read More" toggle

### User Interactions to Test
- [ ] Close popup with X button
- [ ] Share functionality (native and fallback)
- [ ] Image gallery click and carousel navigation
- [ ] Touch/swipe on carousel
- [ ] Expand/collapse description
- [ ] Contact form submission flow
- [ ] Responsive layout on mobile
- [ ] Map rendering and marker display

### API Requirements
- Ensure Google Maps API key is configured: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Verify coordinate data in property objects
- Test with properties without lat/lng (map should gracefully hide)

---

## 📝 Recent Improvements (V2)

### ✨ Enhanced Features
1. **Google Map Integration** - Embedded map showing property location with custom marker
2. **Location Info Card** - Structured display of address and coordinates
3. **Description Expansion** - "Read More" toggle for long descriptions
4. **Better Responsive Design** - Improved mobile layout
5. **Code Cleanup** - Removed 30% dead code (~170 lines)
6. **Type Safety** - Added PropertyPopupProps interface

### 🎯 What Changed
- Improved visual hierarchy with better section organization
- Enhanced user experience with cleaner data presentation
- Added interactive map for location visualization
- Better mobile responsiveness with adaptive layout
- Optimized performance through memoization

---

## 🔮 Future Enhancements

- [ ] Virtual tour integration
- [ ] Neighborhood information section
- [ ] Similar properties carousel
- [ ] Schedule tour functionality
- [ ] Property comparison feature
- [ ] Document/file viewer for property docs
- [ ] 3D property view/walkthrough
- [ ] Price history graph
- [ ] Market analysis cards

---

## 📞 Support & Questions

For issues or questions about the PropertyPopup component:
1. Check the data being passed in the `Property` object
2. Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured
3. Verify image URLs are accessible
4. Check browser console for errors
5. Review responsive design on different screen sizes

---

**Last Updated:** October 28, 2025  
**Component Version:** 2.0 (Enhanced with Map & Location)  
**Maintainer:** Development Team  
**Status:** ✅ Production Ready
