# PropertyPopup V2 - Quick Reference

## 📍 Layout Sections (Top to Bottom)

```
┌─────────────────────────────────────────┐
│  📷 Image Carousel (existing)           │
├─────────────────────────────────────────┤
│  💰 HERO SECTION                        │
│  ┌─────────────────────────────────────┐│
│  │ $450,000          ✅ Available      ││
│  │ Contact Agent | Schedule Tour       ││
│  │ Beautiful Home in Manhattan Beach    ││
│  │ 📍 123 Ocean Ave • Manhattan Beach   ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  🏠 MAIN INFO CARDS                     │
│  ┌─────────────┬─────────────┐         │
│  │ 🛏️ 4 Beds  │ 🚿 3 Baths  │ 📐    │
│  │ Bedrooms    │ Bathrooms   │ 4200  │
│  └─────────────┴─────────────┘ m²    │
├─────────────────────────────────────────┤
│  ✨ HIGHLIGHTS                          │
│  Modern Kitchen | Ocean View | Updated  │
│  Hardwood Floors | Granite Counters     │
├─────────────────────────────────────────┤
│  🏠 FEATURES & AMENITIES                │
│  ┌──────────────┬──────────────────┐   │
│  │ 🏠 Interior  │ 🌳 Outdoor       │   │
│  │ ✓ Hardwood   │ ✓ Patio          │   │
│  │ ✓ AC         │ ✓ Garden         │   │
│  └──────────────┴──────────────────┘   │
├─────────────────────────────────────────┤
│  📝 ABOUT THIS PROPERTY                 │
│  This beautiful oceanfront home offers  │
│  stunning views and modern amenities... │
├─────────────────────────────────────────┤
│  📍 LOCATION                            │
│  Address: 123 Ocean Ave                 │
│  City: Manhattan Beach, CA              │
│  ZIP: 90266                             │
│  [Embedded Google Map]                  │
├─────────────────────────────────────────┤
│  📞 CONTACT CTA                         │
│  [Contact Agent] [Schedule Tour]        │
└─────────────────────────────────────────┘
```

## 🎨 CSS Class Hierarchy

```
.propertyDetailCard (wrapper)
├─ .propertyDetailContent
│  ├─ .propertyDetailBody
│  │  ├─ .heroSection
│  │  │  ├─ .heroHeader
│  │  │  │  ├─ .priceAndStatus
│  │  │  │  └─ .quickActionsRow
│  │  │  ├─ .heroTitle
│  │  │  └─ .heroLocation
│  │  │
│  │  ├─ .mainInfoSection
│  │  │  └─ .mainInfoGrid
│  │  │     └─ .mainInfoCard (x3)
│  │  │
│  │  ├─ .highlightsSection
│  │  │  └─ .highlightsTags
│  │  │     └─ .highlightTag (x8)
│  │  │
│  │  ├─ .featuresSection
│  │  │  └─ .featuresCategoryGrid
│  │  │     ├─ .featureCategory (Interior)
│  │  │     ├─ .featureCategory (Outdoor)
│  │  │     └─ .featureCategory (Amenities)
│  │  │
│  │  ├─ .descriptionSection
│  │  │  └─ .descriptionText
│  │  │
│  │  ├─ .locationSection
│  │  │  └─ .locationGrid
│  │  │     ├─ .locationInfo
│  │  │     └─ .mapContainer
│  │  │
│  │  └─ .contactCTASection
│  │     └─ .contactCTAButtons
│  │        ├─ .btnPrimaryLarge
│  │        └─ .btnSecondaryLarge
│  │
│  └─ .topRightButtons
│     ├─ .iconButton (close)
│     └─ .iconButton (share)
│
└─ .propertyDetailOverlay (backdrop)
```

## 🔧 Component Props & Data

```typescript
// Input: selectedProperty
{
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  zip_code?: string;
  bedrooms: number;
  bathrooms: number;
  sq_meters: number;
  property_status: {
    id: number;
    display_name: string;
    color: string;
  };
  property_type: {
    id: number;
    display_name: string;
  };
  operation_status_id?: number; // 2 = Rental
  features: Array<{
    id: number;
    name: string;
    category?: string; // 'Interior', 'Outdoor', 'Amenities'
  }>;
  images: Array<{...}>;
  lat: number;
  lng: number;
}
```

## 🎯 CSS Custom Properties

**Color Variables** (in design):
```css
/* Primary Gradient */
--hero-gradient-start: #667eea;
--hero-gradient-end: #764ba2;

/* Text Colors */
--text-primary: #1f2937;
--text-secondary: #6b7280;

/* Status Colors */
--status-available: #22c55e;
--status-unavailable: #ef4444;

/* Button Colors */
--btn-primary: #1277e1;
--btn-primary-dark: #0e5fc4;

/* Borders */
--border-color: #e5e7eb;

/* Backgrounds */
--bg-light: #f9fafb;
--bg-white: #ffffff;
```

## 📐 Breakpoint Strategy

| Breakpoint | Device Type | Changes |
|------------|-------------|---------|
| > 768px    | Desktop     | 3-col grid, 2-col location |
| 481-768px  | Tablet      | 1-col grid, full-width buttons |
| < 480px    | Mobile      | Smaller fonts, 16px padding |

## 🎬 Animation / Hover Effects

```css
/* Card Hover */
.mainInfoCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

/* Button Hover */
.btnPrimary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(18, 119, 225, 0.3);
}

/* Tag Hover */
.highlightTag:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #667eea25 0%, #764ba225 100%);
}

/* Icon Button Hover */
.iconButton:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
```

## 🔧 Common Customizations

### Change Hero Gradient
```css
.heroSection {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Spacing
```css
/* All margins/padding use multiples of 16px base unit */
.mainInfoSection { padding: 0 32px; }    /* 2x base */
.mainInfoGrid { gap: 16px; }             /* 1x base */
```

### Modify Button Style
```css
.btnPrimary {
  background: linear-gradient(135deg, #NEW_COLOR1 0%, #NEW_COLOR2 100%);
}
```

### Change Card Border Radius
```css
.mainInfoCard { border-radius: 12px; }   /* Decrease for more squared */
```

## 📊 Responsive Dimensions

```
Desktop (>768px):
  Hero Section: 40px 32px padding
  Main Grid: grid-template-columns: repeat(3, 1fr)
  Location Grid: grid-template-columns: 1fr 1fr
  Features Grid: repeat(auto-fit, minmax(250px, 1fr))

Tablet (481-768px):
  Hero Section: 28px 24px padding
  Main Grid: grid-template-columns: 1fr
  Location Grid: grid-template-columns: 1fr
  Features Grid: repeat(1, 1fr)
  Buttons: width: 100%

Mobile (<480px):
  Hero Section: 20px 16px padding
  Hero Price: 36px (from 48px)
  Hero Title: 22px (from 28px)
  Main Value: 24px (from 28px)
  All sections: 0 16px padding
  Buttons: flex-direction: column
```

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Map not showing | Verify `lat` and `lng` properties exist |
| Features not grouped | Ensure feature `category` field is set correctly |
| Layout broken on mobile | Check media query breakpoints in CSS |
| Buttons overlapping | Verify `.quickActionsRow { flex-wrap: wrap; }` |
| Gradient not rendering | Check browser CSS Gradients support |

## 📝 Git Commit Template

```
feat: redesign PropertyPopup with clean V2 layout

CHANGES:
- Replaced tab-based navigation with unified scrollable sections
- Added gradient hero section with price, availability, location
- Created 3-column main info cards (Beds/Baths/Sqm)
- Organized features by category (Interior/Outdoor/Amenities)
- Added description section
- Integrated location section with embedded Google Maps
- Added contact CTA with prominent buttons
- Fully responsive design (mobile/tablet/desktop)
- 900+ lines of new CSS matching PropertyDetailCard V2
- 0 TypeScript errors, production ready

AFFECTED FILES:
- src/ui/PropertyPopup.tsx (added hero section + new layout)
- src/styles/PropertyPopup.module.css (complete redesign)

TESTING:
✓ Build passes (npm run build)
✓ No TypeScript errors
✓ Responsive on all breakpoints
✓ All sections render correctly
✓ Hover effects work
✓ Feature categorization works
```

---

**Version**: 2.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2025
