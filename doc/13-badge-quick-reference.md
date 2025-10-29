# Badge System Quick Reference

**Quick Developer Guide - Badge Standardization**

---

## Badge Type Summary

### 1. Status Badges (`.statusBadge`)
**When**: Property publication status (Published, Draft, Archived)  
**Where**: PropertyCard, PropertyPopup, PropertyDetailCard  
**Colors**: Green (#2dd96f), Amber (#ffc107), Gray (#9e9e9e)  
**Style**: Soft backgrounds, luxury hover effects

```html
<div class="statusBadge published">
  <span class="badgeIcon">✓</span>
  <span class="badgeText">Published</span>
</div>
```

### 2. Operation Badges (`.operationBadge`)
**When**: Transaction type (For Sale, For Rent, For Buy, For Lease)  
**Where**: PropertyCard  
**Colors**: Green gradient (Sale/Buy), Gold gradient (Rent/Lease)  
**Style**: Rich gradients, strong shadows

```html
<div class="operationBadge sale">
  <span class="badgeIcon">🏷️</span>
  <span class="badgeText">For Sale</span>
</div>
```

### 3. Availability Badges (`.availabilityBadge`)
**When**: Property availability status  
**Where**: PropertyPopup, PropertyDetailCard  
**Colors**: Green (#2dd96f - Available), Red (#dc3333 - Not Available)  
**Style**: Translucent, data-attribute driven

```html
<div class="availabilityBadge" data-available="true">
  <span>•</span>
  <span>Available</span>
</div>
```

### 4. Form Mode Badges (`.formModeBadge`)
**When**: Form state indication (Create/Edit)  
**Where**: Seller dashboard  
**Colors**: Green (Create), Amber (Edit)  
**Style**: Soft backgrounds, compact

```html
<div class="formModeBadge edit">CREATE MODE</div>
```

### 5. Cover Image Badges (`.coverBadge`)
**When**: Mark featured/cover images  
**Where**: Image galleries, property editors  
**Colors**: Gold gradient  
**Style**: Positioned corners, luxury effect

```html
<div class="coverBadge">COVER</div>
```

---

## Color Quick Reference

| Badge Type | Rest Background | Hover Background | Text | Border |
|-----------|-----------------|------------------|------|--------|
| **Published** | rgba(45, 217, 111, 0.12) | #2dd96f → #20b35f | #1a5f3f | #2dd96f |
| **Draft** | rgba(255, 193, 7, 0.12) | #ffc107 → #ffb300 | #8b5f00 | #ffc107 |
| **Archived** | rgba(120, 120, 120, 0.12) | #9e9e9e → #757575 | #4a4a4a | #9e9e9e |
| **Sale/Buy** | #2dd96f → #20b35f | #20b35f → #1a934d | white | #20b35f |
| **Rent/Lease** | #c9a961 → #b39451 | #b39451 → #9d7f45 | white | #b39451 |
| **Available** | rgba(45, 217, 111, 0.15) | #2dd96f → #20b35f | #1a5f3f | #2dd96f |
| **Not Available** | rgba(220, 51, 51, 0.15) | #dc3333 → #b52828 | #5f1a1a | #dc3333 |

---

## CSS Specifications

```css
/* Base Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid;
}

.badge:hover {
  transform: translateY(-3px);
}
```

**Key Properties**:
- `border-radius: 20px` - Luxury rounded design
- `backdrop-filter: blur(10px)` - Frosted glass effect
- `font-weight: 700` - Bold prominence
- `letter-spacing: 0.6px` - Premium spacing

---

## File Structure

### Globally Defined (globals.css)
- Base `.badge` class
- `.badge.published/draft/archived` variants
- `.badge.sale/buy/rent/lease` variants
- `.badge__icon` helper
- `.badge__text` helper

### Component-Specific (module.css)
- PropertyCard: `.statusBadge`, `.operationBadge`
- PropertyPopup: `.statusBadgeMobile`, `.availabilityBadge`
- PropertyDetailCard: `.availabilityBadge`
- Seller: `.formModeBadge`, `.coverBadge`
- Home: `.propertyStatusBadge`

---

## Implementation Examples

### Adding a New Status Badge

```tsx
import styles from '@/styles/PropertyCard.module.css';

<div className={`${styles.statusBadge} ${styles.published}`}>
  <span className={styles.badgeIcon}>📋</span>
  <span className={styles.badgeText}>Published</span>
</div>
```

### Using Data Attributes for Variants

```tsx
<div className={styles.statusBadgeMobile} data-available={property.available}>
  <span className={styles.statusDot} />
  <span className={styles.statusText}>
    {property.available ? 'Available' : 'Not Available'}
  </span>
</div>
```

### Conditional Badge Classes

```tsx
const badgeVariant = status === 'published' ? 'published' 
                   : status === 'draft' ? 'draft' 
                   : 'archived';

<div className={`${styles.statusBadge} ${styles[badgeVariant]}`}>
  {status.toUpperCase()}
</div>
```

---

## Hover Effects

All badges include:
- ✅ **Elevation**: `transform: translateY(-3px)`
- ✅ **Shadow Enhancement**: Increased shadow opacity
- ✅ **Color Transition**: Gradient activation
- ✅ **Duration**: 0.3s with professional easing

---

## Responsive Behavior

| Screen Size | Padding | Font Size | Border Radius |
|------------|---------|-----------|---------------|
| **Desktop** | 10px 14px | 12px | 20px |
| **Tablet** | 10px 14px | 12px | 20px |
| **Mobile** | 8px 12px | 11px | 20px |

---

## Do's & Don'ts

### ✅ DO

- Use standard color palette
- Apply `border-radius: 20px` for consistency
- Include hover states
- Use uppercase text with letter-spacing
- Test on multiple browsers
- Maintain icon-text gap of 6px

### ❌ DON'T

- Use arbitrary colors outside palette
- Reduce border-radius below 20px
- Omit hover states
- Mix with different badge systems
- Use lowercase text
- Forget backdrop-filter for premium feel

---

## Common Patterns

### Pattern 1: Status + Operation Stack

```tsx
<div className={styles.badgesContainer}>
  <div className={`${styles.statusBadge} ${styles.published}`}>
    Published
  </div>
  <div className={`${styles.operationBadge} ${styles.sale}`}>
    For Sale
  </div>
</div>
```

### Pattern 2: Mobile Compact View

```tsx
<div className={styles.statusBadgeMobile} data-available={true}>
  <span className={styles.statusDot} />
  Available
</div>
```

### Pattern 3: Conditional Badge

```tsx
{property.isFeatured && (
  <div className={styles.coverBadge}>COVER</div>
)}
```

---

## Debugging Tips

### Badge not showing color?
- ✓ Check `data-available` attribute matches CSS selector
- ✓ Verify variant class is present
- ✓ Inspect CSS cascade for conflicts

### Hover effect not working?
- ✓ Ensure parent container doesn't override
- ✓ Check z-index relationships
- ✓ Verify `transition` property isn't removed

### Badge misaligned?
- ✓ Check `display: inline-flex` isn't overridden
- ✓ Verify `align-items: center` present
- ✓ Ensure parent has sufficient height

### Performance slow on hover?
- ✓ Backdrop-filter can be intensive
- ✓ Consider reducing blur on mobile
- ✓ Profile performance with DevTools

---

## Testing Checklist

- [ ] Colors match palette specification
- [ ] Border radius is exactly 20px
- [ ] Hover effect scales element up (translateY)
- [ ] Text is uppercase with proper spacing
- [ ] Icon and text aligned vertically
- [ ] Shadow appropriate for depth
- [ ] Works in Chrome, Safari, Firefox
- [ ] Mobile rendering optimized
- [ ] Accessibility preserved
- [ ] No z-index conflicts

---

## Dependencies

**No External Dependencies**  
All badge styles use native CSS with no frameworks or libraries required.

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- iOS Safari 14+
- Android Chrome 10+

---

## Related Documentation

- Full Guide: `/doc/12-badge-standardization.md`
- Color System: `/doc/10-color-palette-implementation.md`
- Design System: `/doc/09-luxury-real-estate-design-system.md`

---

**Version**: 1.0  
**Last Updated**: October 29, 2025  
**Status**: Production Ready
