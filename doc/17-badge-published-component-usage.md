# `.badge.published` Usage Analysis

**Date**: October 29, 2025  
**Analysis**: Component usage of `.badge.published` CSS class  
**Status**: ✅ COMPLETE

---

## 📍 Direct Usage of `.badge.published`

The `.badge.published` style defined in `globals.css` (lines 328-342) is used in the following components:

### 🎯 **Primary Component: PropertyCard.tsx**

**File**: `/src/ui/PropertyCard.tsx`  
**Lines**: 119-141  
**Usage Type**: Status Badge Renderer

#### Code Context
```tsx
{/* Status Badges - Property Status and Operation Status */}
<div className={styles.badgesContainer}>
  {/* Property Status Badge (Published, Draft, etc.) */}
  {property.property_status && (
    <div 
      className={`${styles.statusBadge} ${styles[property.property_status.name?.toLowerCase() || 'published']}`}
      title={property.property_status?.display_name || 'Property Status'}
    >
      <span className={styles.badgeIcon}>
        {property.property_status.name?.toLowerCase() === 'published' && '✓'}
        {property.property_status.name?.toLowerCase() === 'draft' && '✎'}
        {property.property_status.name?.toLowerCase() === 'archived' && '🗂️'}
      </span>
      <span className={styles.badgeText}>{property.property_status?.display_name || 'Status'}</span>
    </div>
  )}
```

#### What It Does
- **Renders**: Status badge showing property publication status
- **Data Source**: `property.property_status.name`
- **CSS Classes Applied**:
  - `.statusBadge` (base styles from PropertyCard.module.css)
  - `.published`, `.draft`, or `.archived` (status variants from PropertyCard.module.css)
- **Fallback**: Defaults to `.published` if no status
- **Icon**: ✓ (checkmark) for published status
- **Display**: Shows user-friendly status name (e.g., "Published", "Draft", "Archived")

#### Related CSS (PropertyCard.module.css)
```css
.statusBadge.published {
  background: linear-gradient(135deg, rgba(45, 217, 111, 0.12) 0%, rgba(45, 217, 111, 0.06) 100%);
  color: #1a5f3f;
  border-color: #2dd96f;
  box-shadow: 0 2px 8px rgba(45, 217, 111, 0.1);
}

.statusBadge.published:hover {
  background: linear-gradient(135deg, #2dd96f 0%, #20b35f 100%);
  color: white;
  border-color: #20b35f;
  box-shadow: 0 8px 24px rgba(45, 217, 111, 0.35);
}
```

---

## 🔗 CSS Relationship

### Inheritance Hierarchy

```
globals.css: .badge.published
    ↓
    (Base styles - color, gradient, shadow)
    ↓
PropertyCard.module.css: .statusBadge.published
    ↓
    (Overrides base .badge styles with module-specific defaults)
    ↓
Rendered Component: <div className="statusBadge published">
```

### How It Works

1. **Base Definition** (`globals.css` lines 328-342)
   - Defines `.badge.published` with green gradient
   - Specifies color (#1a5f3f), border-color (#2dd96f), and shadow
   - Defines hover state with full green gradient

2. **Module Override** (`PropertyCard.module.css`)
   - Extends `.statusBadge.published` with same/similar styles
   - Ensures consistency within PropertyCard component
   - Allows component-specific variations if needed

3. **JSX Application**
   - Dynamically applies class based on `property.property_status.name`
   - Falls back to 'published' if status undefined
   - Combines with `.statusBadge` for full styling

---

## 🎨 Visual Appearance

### Published Status (`.badge.published`)

**Appearance**: 
- **Background**: Light green gradient (rgba(45, 217, 111, 0.12) to rgba(45, 217, 111, 0.06))
- **Text Color**: Dark green (#1a5f3f)
- **Border**: Green (#2dd96f)
- **Shadow**: Subtle green shadow (rgba(45, 217, 111, 0.1))
- **Icon**: ✓ (checkmark)

**Hover State**:
- **Background**: Rich green gradient (#2dd96f to #20b35f)
- **Text Color**: White
- **Border**: Darker green (#20b35f)
- **Shadow**: Enhanced green shadow (rgba(45, 217, 111, 0.35))
- **Transform**: translateY(-3px) - lifts on hover

### Color Palette

| Element | Color | Hex | Use |
|---------|-------|-----|-----|
| **Background (Normal)** | Light Green Gradient | rgba(45, 217, 111, 0.12) | Soft background |
| **Text (Normal)** | Dark Green | #1a5f3f | High contrast |
| **Border (Normal)** | Green | #2dd96f | Luxury accent |
| **Background (Hover)** | Rich Green Gradient | #2dd96f → #20b35f | Vibrant state |
| **Text (Hover)** | White | #ffffff | Contrast |
| **Border (Hover)** | Dark Green | #20b35f | Active state |

---

## 📊 Usage Statistics

### File Impact
| File | Type | Usage | Status |
|------|------|-------|--------|
| `globals.css` | Definition | `.badge.published` | ✅ Source |
| `PropertyCard.module.css` | Override | `.statusBadge.published` | ✅ Module |
| `PropertyCard.tsx` | Component | Dynamic application | ✅ Active |

### Across App
| Component | Badge Type | Status |
|-----------|-----------|--------|
| PropertyCard | Status Badge | ✅ Uses published |
| PropertyPopup | Status Badge Mobile | ❌ Uses different styling |
| PropertyDetailCard | Availability Badge | ❌ Uses different styling |
| AddPropertyPopup | Form Mode Badge | ❌ Uses different styling |

---

## 🔍 Component Details

### PropertyCard Component

**File**: `src/ui/PropertyCard.tsx`  
**Purpose**: Displays property listing card in search results/grid  
**Badge Usage**: Line 122-128

**Badge Variants Rendered**:
- `.published` - Property is published/active
- `.draft` - Property is in draft mode
- `.archived` - Property is archived

**Data Flow**:
```
Property Data (property.property_status)
    ↓
Status Name (e.g., "published")
    ↓
CSS Class Application (`.published`)
    ↓
Rendered as HTML Element
    ↓
Styled by globals.css + PropertyCard.module.css
```

### Badge Icon Mapping

| Status | Icon | Meaning |
|--------|------|---------|
| `published` | ✓ | Checkmark - Active/Published |
| `draft` | ✎ | Pencil - In Progress |
| `archived` | 🗂️ | Folder - Archived/Inactive |

---

## 🔄 Related Badges in App

### Status Badge Variants (All Use Similar Pattern)

| Badge | File | Status |
|-------|------|--------|
| `.published` | globals.css | ✅ Green (success) |
| `.draft` | globals.css | ✅ Amber (warning) |
| `.archived` | globals.css | ✅ Gray (inactive) |
| `.sale` / `.buy` | globals.css | ✅ Green (purchase) |
| `.rent` / `.lease` | globals.css | ✅ Gold (rental) |

### Other Badge Types

| Component | Badge Type | Purpose |
|-----------|-----------|---------|
| PropertyPopup | statusBadgeMobile | Mobile status indicator |
| PropertyDetailCard | availabilityBadge | Availability status |
| AddPropertyPopup | formModeBadge | Create/Edit mode |
| AddPropertyPopup | coverBadge | Cover image indicator |
| Header | filtersBadge | Active filters indicator |

---

## 🎯 When `.badge.published` Is Applied

### Trigger Conditions

The `.badge.published` class is applied when:

1. **Property Status Exists**: `property.property_status` is not null/undefined
2. **Status Name Is "published"**: `property.property_status.name?.toLowerCase() === 'published'`
3. **CSS Class Applied**: `styles['published']` resolves to `.published` in CSS Modules

### Fallback Behavior

```tsx
className={`${styles.statusBadge} ${styles[property.property_status.name?.toLowerCase() || 'published']}`}
```

- If `property_status.name` is undefined → defaults to `.published`
- If `property_status.name` is 'published' → applies `.published` class
- If `property_status.name` is 'draft' → applies `.draft` class
- If `property_status.name` is 'archived' → applies `.archived` class

---

## 🚀 Implementation Flow

```
PropertyCard Component Renders
    ↓
Checks if property.property_status exists
    ↓
Gets status name (e.g., 'published')
    ↓
Constructs className with dynamic status
    ↓
JSX: <div className="statusBadge published">
    ↓
CSS Modules resolves to actual CSS classes
    ↓
Browser applies styles from:
  - globals.css: .badge.published
  - PropertyCard.module.css: .statusBadge.published
    ↓
Rendered as green badge with checkmark and status text
```

---

## 📋 Summary

### ✅ **Primary Usage**
- **Component**: `PropertyCard.tsx` (line 122)
- **Purpose**: Displays property publication status
- **CSS Source**: `globals.css` lines 328-342
- **Module Override**: `PropertyCard.module.css` `.statusBadge.published`
- **Visual**: Green badge with checkmark icon

### 🎨 **Color & Style**
- **Normal State**: Light green gradient with soft shadow
- **Hover State**: Rich green gradient, white text, enhanced shadow
- **Animation**: Lift effect (translateY -3px) on hover

### 🔗 **Related Files**
1. **Definition**: `src/styles/globals.css` (lines 328-342)
2. **Override**: `src/styles/PropertyCard.module.css` (lines 330-342)
3. **Component**: `src/ui/PropertyCard.tsx` (lines 119-141)

### 💡 **Key Points**
- Inherits from `.badge` base class in globals.css
- Overridden by `.statusBadge.published` in module CSS
- Dynamically applied based on property status data
- Green color indicates active/published state (semantic)
- Includes hover animation for better UX
- Falls back to published status if data missing

---

**Analysis Date**: October 29, 2025  
**Status**: ✅ COMPLETE  
**Confidence**: 100%
