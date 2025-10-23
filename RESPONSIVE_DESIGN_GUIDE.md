# Responsive Design System - Implementation Guide

## Overview

This document provides standardized responsive design patterns for the Ubika real estate application. All views should be optimized for mobile-first development across 6 device breakpoints.

## Device Breakpoints

| Breakpoint | Name | Device Examples | Screen Width |
|-----------|------|-----------------|-------------|
| **XS** | Extra Small | iPhone SE, very old phones | < 360px |
| **SM** | Small | iPhone 12/13/14 (standard) | 360-479px |
| **MD** | Medium | Large phones, small tablets | 480-767px |
| **LG** | Large | iPad, tablets | 768-1023px |
| **XL** | Extra Large | Laptop, small desktop | 1024-1439px |
| **2XL** | 2X Large | Desktop, large monitors | >= 1440px |

## Header Heights by Breakpoint

| Breakpoint | Height | Notes |
|-----------|--------|-------|
| XS | 52px | Minimal header for tiny screens |
| SM | 56px | Standard mobile |
| MD | 60px | Larger mobile |
| LG | 64px | Tablet |
| XL | 66px | Small desktop |
| 2XL | 68px | Large desktop |

## CSS Structure & Variables

### CSS Custom Properties (CSS Variables)

```css
:root {
  /* Breakpoint values */
  --breakpoint-xs: 360px;
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;

  /* Header heights */
  --header-height-xs: 52px;
  --header-height-sm: 56px;
  --header-height-md: 60px;
  --header-height-lg: 64px;
  --header-height-xl: 68px;

  /* Content padding */
  --content-padding-xs: 8px;
  --content-padding-sm: 12px;
  --content-padding-md: 16px;
  --content-padding-lg: 24px;
  --content-padding-xl: 32px;

  /* Grid gaps */
  --grid-gap-xs: 8px;
  --grid-gap-sm: 12px;
  --grid-gap-md: 16px;
  --grid-gap-lg: 24px;
  --grid-gap-xl: 32px;
}
```

## Implementation Patterns

### 1. Page Container with Header Offset

```css
.pageContainer {
  min-height: 100vh;
  padding-top: var(--header-height-md); /* Default: 60px */
  background-color: #f9f9f9;
}

/* Responsive padding adjustments */
@media (max-width: 359px) {
  .pageContainer { padding-top: var(--header-height-xs); }
}

@media (min-width: 360px) and (max-width: 479px) {
  .pageContainer { padding-top: var(--header-height-sm); }
}

@media (min-width: 768px) {
  .pageContainer { padding-top: var(--header-height-lg); }
}

@media (min-width: 1024px) {
  .pageContainer { padding-top: var(--header-height-xl); }
}
```

### 2. Responsive Grid (Property Cards)

```css
.propertyGrid {
  display: grid;
  gap: var(--grid-gap-md);
  padding: 0;
}

/* XS-SM: 1 column */
@media (max-width: 479px) {
  .propertyGrid {
    grid-template-columns: 1fr;
    gap: var(--grid-gap-sm);
  }
}

/* MD-LG: Auto-fill with minimum column width */
@media (min-width: 480px) and (max-width: 1023px) {
  .propertyGrid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--grid-gap-md);
  }
}

/* XL+: 3-4 column layout */
@media (min-width: 1024px) {
  .propertyGrid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--grid-gap-lg);
  }
}
```

### 3. Responsive Flex Layout with Sidebar

```css
.layoutWithSidebar {
  display: flex;
  flex-direction: column;
  gap: var(--grid-gap-md);
}

/* Desktop: Side-by-side layout */
@media (min-width: 768px) {
  .layoutWithSidebar {
    flex-direction: row;
    gap: var(--grid-gap-lg);
  }

  .layoutWithSidebar-main {
    flex: 1;
    min-width: 0; /* Prevents flex children from overflowing */
  }

  .layoutWithSidebar-side {
    width: 280px;
    flex-shrink: 0;
  }
}
```

### 4. Responsive Typography

```css
/* Base font sizing */
.title {
  font-size: 1.875rem; /* 30px default */
  line-height: 2.25rem;
}

/* Reduce on tablets */
@media (max-width: 767px) {
  .title {
    font-size: 1.5rem; /* 24px */
  }
}

/* Reduce further on mobile */
@media (max-width: 479px) {
  .title {
    font-size: 1.25rem; /* 20px */
  }
}

/* Reduce on very small phones */
@media (max-width: 359px) {
  .title {
    font-size: 1.125rem; /* 18px */
  }
}
```

### 5. Responsive Padding/Margin

```css
.sectionContent {
  padding: var(--content-padding-lg); /* 24px default */
}

@media (max-width: 767px) {
  .sectionContent {
    padding: var(--content-padding-md); /* 16px */
  }
}

@media (max-width: 479px) {
  .sectionContent {
    padding: var(--content-padding-sm); /* 12px */
  }
}

@media (max-width: 359px) {
  .sectionContent {
    padding: var(--content-padding-xs); /* 8px */
  }
}
```

### 6. Responsive Images

```css
.propertyImage {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

@media (max-width: 479px) {
  .propertyImage {
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-md);
  }
}
```

### 7. Mobile/Desktop Toggle

```css
.desktopOnly {
  display: none;
}

.mobileOnly {
  display: block;
}

@media (min-width: 768px) {
  .desktopOnly {
    display: block;
  }

  .mobileOnly {
    display: none;
  }
}
```

## Common Component Patterns

### Search Bar

```css
/* Mobile: Full width search */
.searchContainer {
  width: 100%;
  padding: var(--content-padding-md);
}

/* Desktop: Centered search with sidebar */
@media (min-width: 768px) {
  .searchContainer {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--content-padding-lg);
  }
}
```

### Property Card

```css
.propertyCard {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.propertyCardImage {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

@media (max-width: 479px) {
  .propertyCard {
    border-radius: var(--radius-md);
  }

  .propertyCardImage {
    height: 180px;
  }
}

@media (max-width: 359px) {
  .propertyCardImage {
    height: 150px;
  }
}

/* Hover effect on desktop only */
@media (hover: hover) and (min-width: 768px) {
  .propertyCard:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}
```

### Navigation

```css
/* Mobile: Horizontal pill navigation */
.navigation {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: var(--content-padding-md);
}

/* Desktop: Vertical navigation in header */
@media (min-width: 768px) {
  .navigation {
    display: flex;
    flex-direction: row;
    gap: var(--grid-gap-lg);
    padding: 0;
  }
}
```

## Typography Scaling

The application uses responsive font sizing:

```
XS: 13px base
SM: 14px base
MD: 15px base
LG-XL: 16px base
2XL: 16px base
```

This is set in `globals.css` via responsive `html { font-size: ... }` declarations.

## Best Practices

### ✅ DO:
- Use **mobile-first** approach (base styles for mobile, add enhancements with @media)
- Use **CSS variables** from responsive.module.css for consistency
- Test on **real devices** and browser DevTools (iPhone, iPad, Desktop)
- Use **viewport meta tag**: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Use **flexible units** (%, em, rem) instead of fixed px when possible
- Add **touch targets** min 44px height on mobile
- Test **orientation changes** (portrait/landscape)

### ❌ DON'T:
- Hardcode breakpoints (use CSS variables instead)
- Forget to test on actual mobile devices
- Use fixed heights/widths that break layout
- Stack too much content on small screens without scrolling
- Use desktop-first approach (harder to implement)
- Forget `min-width: 0` on flex children with long content

## Testing Checklist

- [ ] Mobile phone (XS/SM) - 360px, 480px
- [ ] Large phone/Tablet (MD/LG) - 767px, 1023px
- [ ] Desktop (XL) - 1024px, 1439px
- [ ] Large desktop (2XL) - 1440px+
- [ ] Landscape orientation
- [ ] Touch interactions work on mobile
- [ ] No horizontal scrolling
- [ ] Text is readable (minimum 16px on mobile)
- [ ] Buttons are tappable (minimum 44px)
- [ ] Images load and scale correctly
- [ ] Forms are mobile-friendly

## Files to Update

When standardizing responsive design:

1. `src/styles/responsive.module.css` - Central breakpoint & utility file
2. `src/styles/Layout.module.css` - Update page container logic
3. `src/styles/Header.module.css` - Standardize header heights
4. `src/styles/PropertyCard.module.css` - Use new grid patterns
5. `src/styles/PropertyDetail.module.css` - Standardize detail view
6. `src/styles/Home.module.css` - Update property grid layouts
7. All component CSS files - Use variables instead of hardcoded values

## Example: Complete Property Detail Page

```css
.propertyDetailContainer {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--content-padding-lg);
}

.propertyHeader {
  display: flex;
  flex-direction: column;
  gap: var(--grid-gap-md);
  margin-bottom: var(--grid-gap-lg);
}

.propertyImage {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

.propertyInfo {
  flex: 1;
}

.propertyTitle {
  font-size: 2rem;
  margin-bottom: 8px;
}

/* Tablet: Side-by-side layout starts here */
@media (min-width: 768px) {
  .propertyHeader {
    flex-direction: row;
    align-items: flex-start;
  }

  .propertyImage {
    width: 50%;
    height: 400px;
  }

  .propertyInfo {
    width: 50%;
    padding-left: var(--grid-gap-lg);
  }

  .propertyTitle {
    font-size: 2.5rem;
  }
}

/* Desktop: Full enhancement */
@media (min-width: 1024px) {
  .propertyDetailContainer {
    padding: var(--content-padding-xl);
  }

  .propertyImage {
    height: 500px;
  }

  .propertyTitle {
    font-size: 3rem;
  }
}
```

## References

- [MDN: Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google: Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
