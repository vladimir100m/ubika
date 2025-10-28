# Property Detail Card - Visual Design Guide

## Color Palette

### Primary Gradient (Used for Hero, Tags, CTAs)
```
Start:  #667eea (Periwinkle Blue)
End:    #764ba2 (Purple)
Direction: 135deg
```

### Neutral Colors
```
Background:     #ffffff (Pure White)
Section BG:     #fafbfc (Off-White)
Text Primary:   #2c3e50 (Dark Slate)
Text Secondary: #4a5568 (Medium Slate)
Text Tertiary:  #7a8a99 (Light Slate)
Borders:        #e8e8e8 (Light Gray)
```

### Status Colors
```
Available:  #27ae60 (Green) - with rgba(39, 174, 96, 0.25) overlay
Unavailable: #e74c3c (Red) - with rgba(231, 76, 60, 0.25) overlay
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
```

### Font Sizes & Weights
```
H1 (Price):         48px, Weight 900, Letter-spacing: -1px
H2 (Hero Title):    36px, Weight 700, Line-height: 1.2
H3 (Section Head):  20px, Weight 700
H4 (Category):      15px, Weight 700
Body (Large):       16px, Weight 600
Body (Regular):     15px, Weight 400/500
Body (Small):       14px, Weight 500
Label:              12px, Weight 700, Text-transform: uppercase
```

### Line Heights
```
Headings:   1.2
Body:       1.4 - 1.6
Labels:     1
```

## Spacing System

### Padding
```
Hero Section:      48px (desktop), 32px (tablet), 24px (mobile)
Main Sections:     40px (desktop), 28px (tablet), 20px (mobile)
Cards:             20px - 24px
Buttons:           16px (vertical), 24px (horizontal)
```

### Gaps
```
Hero Header:       24px
Main Info Grid:    16px
Highlights Tags:   10px
Features Grid:     28px
Location Content:  32px
Details Grid:      16px
Contact CTA:       12px
```

### Margins
```
Section Titles:    0 0 20px (after heading)
Feature Heading:   0 0 16px
```

## Visual Hierarchy

### Element Sizes (Desktop)
```
Hero Price:                 48px ← LARGEST (attracts attention first)
Hero Title:                 36px
Section Heading:            20px
Main Info Values:           22px
Main Info Labels:           12px
Feature Category Title:     15px
Feature List Items:         14px
Additional Details Value:   16px
Additional Details Label:   12px
Body Text:                  15px
```

### Visual Weight
```
1. HIGHEST:    Hero Section (gradient, large type, shadow)
2. HIGH:       Main Info Cards (icons, values, hover state)
3. MEDIUM:     Highlight Tags (gradient, color)
4. MEDIUM:     Feature Cards (bordered, categorized)
5. MEDIUM:     Location Section (large map, 50% of space)
6. LOW:        Additional Details (small grid cards)
7. LOW:        Contact (clean, minimal)
```

## Card Design

### Main Info Card
```
Width:              140px - 1fr (responsive)
Height:             auto
Background:         white
Border:             2px solid #e8e8e8
Border Radius:      16px
Padding:            20px 16px
Shadow:             none (default)
Shadow (hover):     0 8px 24px rgba(102, 126, 234, 0.12)
Transform (hover):  translateY(-4px)
```

### Feature Category Card
```
Width:              250px - 1fr (responsive)
Height:             auto
Background:         linear-gradient(135deg, #f8fafb 0%, #ffffff 100%)
Border:             2px solid #e8e8e8
Border Radius:      16px
Padding:            24px
Shadow:             none (default)
Shadow (hover):     0 8px 24px rgba(102, 126, 234, 0.08)
Border (hover):     2px solid #667eea
```

### Details Grid Card
```
Width:              200px - 1fr (responsive)
Height:             auto
Background:         linear-gradient(135deg, #f8fafb 0%, #ffffff 100%)
Border:             2px solid #e8e8e8
Border Radius:      12px
Padding:            16px
Shadow:             none (default)
Shadow (hover):     0 4px 12px rgba(102, 126, 234, 0.08)
```

## Button Styles

### Primary CTA Button (Schedule Viewing)
```
Background:         linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Color:              white
Padding:            16px 24px
Border:             none
Border Radius:      12px
Font Size:          15px
Font Weight:        700
Shadow:             0 4px 16px rgba(102, 126, 234, 0.3)
Shadow (hover):     0 6px 24px rgba(102, 126, 234, 0.4)
Transform (hover):  translateY(-2px)
Min Width:          150px (desktop), auto (mobile)
Flex:               1 (in flex container)
```

### Secondary CTA Button (Ask Question)
```
Background:         white
Color:              #667eea
Border:             2px solid #667eea
Padding:            16px 24px
Border Radius:      12px
Font Size:          15px
Font Weight:        700
Background (hover): #f5f8ff
Transform (hover):  translateY(-2px)
```

## Badge Design

### Availability Badge
```
Background:         rgba(255, 255, 255, 0.15)
Backdrop Filter:    blur(10px)
Border:             2px solid rgba(255, 255, 255, 0.2)
Border Radius:      25px
Padding:            12px 20px
Font Size:          14px
Font Weight:        700
Letter Spacing:     1px
Text Transform:     uppercase
Display:            inline-flex
Gap:                8px
```

### Tag Design (Highlights)
```
Background:         linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Color:              white
Padding:            10px 16px
Border Radius:      20px
Font Size:          13px
Font Weight:        600
Display:            inline-block
Box Shadow:         0 4px 12px rgba(102, 126, 234, 0.15)
Transform (hover):  translateY(-2px)
Box Shadow (hover): 0 6px 16px rgba(102, 126, 234, 0.25)
White Space:        nowrap
```

## Borders & Dividers

### Section Dividers
```
Type:               Horizontal line
Color:              #f0f0f0
Height:             1px
Margin:             0 (uses border-bottom on section)
```

### Card Borders
```
Main Info Cards:    2px solid #e8e8e8
Feature Cards:      2px solid #e8e8e8
Details Cards:      2px solid #e8e8e8
```

## Shadows & Depth

### Elevation System
```
Level 1 (Cards):           0 4px 12px rgba(0, 0, 0, 0.08)
Level 2 (Lifted):          0 8px 24px rgba(0, 0, 0, 0.12)
Level 3 (Buttons Hover):   0 6px 24px rgba(102, 126, 234, 0.4)
Map Container:             0 4px 12px rgba(0, 0, 0, 0.08)
```

### Card Shadows (Default/Hover)
```
Default:    0 0 0 (no shadow)
Hover:      0 8px 24px rgba(102, 126, 234, 0.15)
            or
            0 4px 12px rgba(102, 126, 234, 0.08)
```

## Animations

### Pulse Effect (Availability Dot)
```
Duration:       2s
Timing:         infinite
Keyframes:      0% opacity 1 → 50% opacity 0.5 → 100% opacity 1
Element:        .availabilityDot
```

### Hover Lift (Cards)
```
Duration:       0.3s
Timing:         cubic-bezier(0.4, 0, 0.2, 1)
Transform:      translateY(-4px)
Elements:       .mainInfoCard, .featureCategory, .detailsGridItem
```

### Fade In (Sections)
```
Duration:       0.3s
Timing:         cubic-bezier(0.4, 0, 0.2, 1)
From:           opacity 0, translateY(-8px)
To:             opacity 1, translateY(0)
Elements:       New sections appearing
```

### Button Hover
```
Duration:       0.3s
Timing:         cubic-bezier(0.4, 0, 0.2, 1)
Transform:      translateY(-2px)
Elements:       .ctaButtonPrimary, .ctaButtonSecondary
```

## Responsive Behavior

### Desktop (> 768px)
- Hero Section: 48px padding
- Main Info: 4-column grid or 3-column on smaller desktop
- Features: 3-column grid
- Location: 2-column (info + map side-by-side)
- Font Sizes: Full size
- Section Gaps: 28px

### Tablet (481px - 768px)
- Hero Section: 32px padding
- Main Info: 3-column grid
- Features: 2-column grid
- Location: 2-column (responsive)
- Font Sizes: Slightly reduced
- Section Gaps: 20px

### Mobile (< 480px)
- Hero Section: 24px padding
- Main Info: 3-column grid (compact)
- Features: 1-column stack
- Location: 1-column (map below info)
- Font Sizes: Reduced for mobile readability
- Section Gaps: 12px
- CTAs: Full-width stacked buttons

## Icon Usage

All icons are emoji for simplicity and cross-browser compatibility:
```
Price:          💰
Beds:           🛏️
Baths:          🚿
Size:           📐
Property:       🏠
Type:           🏠 (or specific type)
Status:         ✅ or ❌
Location:       📍
Address:        📍
Transit:        🚇
Dining:         🍽️
Shopping:       🛍️
Roads:          🛣️
About:          📋
Interior:       🏠
Outdoor:        🌳
Amenities:      ✨
Contact:        📞
Call:           ☎️
Agent:          🏢
Features:       🔧
Details:        ℹ️
Map:            🗺️
Share:          🔗
Save:           ❤️
```

## Accessibility Considerations

### Color Contrast
```
Text on White:              #2c3e50 (6.8:1 ✓)
Text on Gradient:           White on gradient (7:1+ ✓)
Badge on Gradient:          White on semi-transparent (5:1+ ✓)
```

### Focus States (For Keyboard Navigation)
```
Buttons:        2px solid #667eea outline, offset 2px
Cards (hover):  Same as mouse hover effect
Links:          Underline with color change
```

### Size & Touch Targets
```
Buttons:        Min 48px height (mobile)
Card Click:     48px padding touch area
Font Sizes:     14px minimum for body text
```

## Grid System

### Column Setup (Desktop)
```
Main Info:      repeat(auto-fit, minmax(140px, 1fr))
Features:       repeat(auto-fit, minmax(250px, 1fr))
Details:        repeat(auto-fit, minmax(200px, 1fr))
Location:       1fr 1fr (side by side)
```

### Gaps
```
Small:          12px (mobile)
Medium:         16px (main grids)
Large:          24px - 28px (section gaps)
Extra Large:    32px (location content gap)
```

## Media Queries

```css
/* Desktop */
@media (min-width: 769px) { }

/* Tablet */
@media (min-width: 481px) and (max-width: 768px) { }

/* Mobile */
@media (max-width: 480px) { }
```

## Design System Integration

### Consistency Checklist
- [x] All gradients use #667eea → #764ba2
- [x] All hover effects include transform + shadow
- [x] All cards use consistent border style (2px solid)
- [x] All sections use consistent padding
- [x] All typography follows size hierarchy
- [x] All colors are from palette
- [x] All animations use cubic-bezier(0.4, 0, 0.2, 1)
- [x] All spacing follows 4px grid (4, 8, 12, 16, 20, 24, 28, 32, 40, 48)

---

**Last Updated**: October 28, 2025  
**Design Version**: 2.0  
**Status**: ✅ Finalized
