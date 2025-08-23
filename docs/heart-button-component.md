# HeartButton Component

A standardized, animated heart/favorite button component used throughout the Ubika application for saving/unsaving properties.

## Features

- **Three size variants**: small (32px), medium (40px), large (48px)
- **Three style variants**: card, popup, floating
- **Smooth animations**: heartbeat effect, pulse ring, success feedback
- **Loading states**: spinner animation while processing
- **Accessibility**: proper ARIA labels and keyboard navigation
- **Authentication handling**: redirects to login if user not authenticated
- **Responsive design**: optimized for mobile and desktop

## Usage

```tsx
import HeartButton from './HeartButton';

<HeartButton
  isFavorite={isFavorite}
  onToggle={handleToggle}
  size="medium"
  variant="card"
  isLoading={isLoading}
/>
```

## Props

- `isFavorite`: boolean - Whether the property is currently favorited
- `onToggle`: () => void - Callback when favorite status changes
- `size`: 'small' | 'medium' | 'large' - Size variant (default: 'medium')
- `variant`: 'card' | 'popup' | 'floating' - Style variant (default: 'card')
- `isLoading`: boolean - Show loading state (default: false)
- `disabled`: boolean - Disable the button (default: false)
- `className`: string - Custom CSS class

## Variants

### Card Variant
- Semi-transparent dark background with white icon
- Used on property cards overlaying images
- Hover effect: darker background, scale up

### Popup Variant  
- Light background with gray icon
- Used in property detail popups
- Active state: red gradient background

### Floating Variant
- Glassmorphism effect with backdrop blur
- Used for floating action buttons
- Most premium visual treatment

## Animations

- **Heartbeat**: When toggling favorite status
- **Pulse ring**: Expanding ring effect on activation
- **Success indicator**: Small green checkmark for saved items
- **Scale transitions**: Smooth scaling on hover/active states

## Implementation

The component automatically handles:
- User authentication checking
- Click event stopping propagation
- Loading state management
- Accessibility attributes
- Responsive sizing

## Used In

- PropertyCard component (variant: 'card')
- PropertyPopup component (variant: 'floating') 
- Property detail pages (variant: 'popup')
- Featured properties sections
