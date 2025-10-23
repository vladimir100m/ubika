# Ubika - Real Estate App

A modern Next.js real estate application with serverless PostgreSQL (Neon) backend, interactive map visualization, and responsive design optimized for all devices.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database](#database)
- [Architecture](#architecture)
- [Grid Layouts & Property Display](#grid-layouts--property-display)
- [Development Guide](#development-guide)
- [API Endpoints](#api-endpoints)
- [File Locations Reference](#file-locations-reference)
- [Contributing](#contributing)
- [Responsive Design System](#responsive-design-system)
- [Code Organization & Best Practices](#code-organization--best-practices)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## ✨ Features

- **Modern Property Search**: Advanced filtering by price, location, property type, and features
- **Interactive Map**: Google Maps integration for property visualization with sidebar property list
- **Property Gallery**: Beautiful image galleries for each property with carousel and grid views
- **Neighborhood Information**: Detailed neighborhood data with walkability scores, safety ratings, and amenities
- **User Accounts**: Authentication with NextAuth.js, profile management, saved properties
- **Property Management**: Seller dashboard for property listings and management
- **Responsive Design**: Mobile-first design with 6 standardized breakpoints (XS-2XL)
- **Serverless Database**: Powered by Neon Database for optimal performance and automatic scaling
- **Image Management**: Optimized image handling with fallbacks and multiple display formats

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL connection string (Neon Database)
- Google Maps API key (for map features)
- NextAuth.js configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ubika
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=...
   ```

4. **Initialize database**
   ```bash
   npm run db:setup
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

### Database Commands

```bash
npm run db:test        # Test database connection
npm run db:setup       # Complete setup (recommended)
npm run db:reset       # Reset database (truncate tables)
npm run db:list        # List properties for verification
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 13+ (App Router + Pages Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18
- **Styling**: CSS Modules with responsive design
- **Maps**: Google Maps integration
- **Image Carousel**: react-multi-carousel

### Backend
- **API**: Next.js API routes
- **Authentication**: NextAuth.js
- **Database**: Neon (serverless PostgreSQL)
- **HTTP Client**: Axios
- **Logging**: Custom logger utility

### Database Features
- Automatic scaling to zero when not in use
- Built-in connection pooling
- Point-in-time recovery
- Database branching for development
- Seamless Vercel integration

---

## 📁 Project Structure

```
ubika/
├── public/                 # Static assets
│   ├── manifest.json
│   ├── service-worker.js
│   ├── icons/
│   └── ubika-logo.png
│
├── src/
│   ├── app/               # Next.js App Router (modern pages)
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Home page with search results
│   │   ├── providers.tsx  # Context providers
│   │   ├── (seller)/      # Seller routes
│   │   ├── api/           # API routes
│   │   │   ├── properties/
│   │   │   ├── auth/
│   │   │   ├── neighborhoods/
│   │   │   └── blobs/
│   │   ├── map/           # Map page with sidebar
│   │   ├── property/      # Property detail page
│   │   └── seller/        # Seller dashboard
│   │
│   ├── pages/             # Next.js Pages Router (legacy)
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── account.tsx
│   │   ├── profile.tsx
│   │   ├── api/
│   │   └── auth/
│   │
│   ├── ui/                # Reusable UI components
│   │   ├── Banner.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyCardGrid.tsx       # Main grid layout component
│   │   ├── PropertyDetailCard.tsx
│   │   ├── PropertyGallery.tsx
│   │   ├── PropertyImageCarousel.tsx
│   │   ├── PropertyImageGrid.tsx
│   │   ├── PropertyPopup.tsx
│   │   ├── FeaturedProperties.tsx
│   │   ├── SearchBar.tsx
│   │   ├── MapFilters.tsx
│   │   ├── SellerDashboard.tsx
│   │   ├── StandardLayout.tsx
│   │   ├── StateComponents.tsx
│   │   └── index.ts
│   │
│   ├── lib/               # Utilities and helpers
│   │   ├── db.ts          # Database connection
│   │   ├── cache.ts       # Caching utilities
│   │   ├── logger.ts      # Logging utility
│   │   ├── format.ts      # Formatting utilities
│   │   ├── blob.ts        # Image blob handling
│   │   ├── propertyImageUtils.ts        # Centralized image functions
│   │   ├── formatPropertyUtils.ts       # Centralized formatting
│   │   ├── useMediaQuery.ts
│   │   ├── useResolvedImage.ts          # Async image resolution hook
│   │   ├── propertyImages.ts
│   │   ├── sessionCache.ts
│   │   ├── mobileDetect.ts
│   │   └── index.ts
│   │
│   ├── styles/            # Global styles and modules
│   │   ├── globals.css
│   │   ├── Layout.module.css
│   │   ├── Header.module.css
│   │   ├── PropertyCard.module.css
│   │   ├── PropertyDetail.module.css
│   │   ├── Home.module.css              # Large file with property grid styles
│   │   ├── SearchBar.module.css
│   │   ├── MapFilters.module.css
│   │   ├── responsive.module.css        # Responsive design system (CSS variables)
│   │   └── [other component styles]
│   │
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Centralized types (Property, Neighborhood, etc.)
│   │
│   └── test/              # Test utilities and factories
│       └── factories/
│
├── docs/                  # Documentation
│   ├── db_metadata/       # Database schema metadata (CSV exports)
│   │   ├── tables.csv
│   │   ├── columns.csv
│   │   └── constraints.csv
│   └── NEON_SCHEMA.md     # Database schema reference
│
├── scripts/               # Utility scripts
│   ├── reset_and_seed_catalogs.sql
│   ├── clear-cache.js
│   ├── add_serial_to_catalogs.sql
│   └── truncate_all_data.sql
│
├── config/                # Configuration files
├── next.config.js         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── package.json
├── Makefile
└── README.md             # This file
```

---

## 🗄️ Database

### Database Setup

Ubika uses **Neon Database**, a serverless PostgreSQL platform:

```bash
# Test database connection
npm run db:test

# Complete database setup (creates tables, runs migrations)
npm run db:setup

# Reset database (truncate all tables)
npm run db:reset

# List all properties for verification
npm run db:list
```

### Schema Overview

#### Main Tables

**`properties`** - Core property listings
- `id` (UUID) - Primary key
- `title`, `description` - Property details
- `price` (numeric) - Price in USD
- `address`, `city`, `state`, `country`, `zip_code` - Location
- `type` (text) - Property type (apartment, house, etc.)
- `room`, `bathrooms` - Bed/bath count
- `square_meters` - Size in square meters
- `status` - Property status (available, sold, etc.)
- `year_built` - Construction year
- `seller_id` - Link to seller
- `operation_status_id` - Foreign key to property_operation_statuses
- `latitude`, `longitude`, `geocode` - Map coordinates
- `created_at`, `updated_at` - Timestamps

**`property_images`** - Property photos
- `id` (integer) - Primary key
- `property_id` (UUID) - Foreign key to properties
- `image_url` (varchar) - Image URL
- `is_cover` (boolean) - Cover image flag
- `display_order` (integer) - Display sequence
- `created_at`, `updated_at` - Timestamps

**`neighborhoods`** - Neighborhood information
- `id` (integer) - Primary key
- `name`, `city`, `state`, `country` - Location
- `description` - Neighborhood details
- `subway_access`, `dining_options`, `schools_info`, `shopping_info`, `parks_recreation` - Amenities
- `safety_rating`, `walkability_score` (integer) - Ratings
- `created_at`, `updated_at` - Timestamps

**`property_features`** - Available features/amenities
- `id` (integer) - Primary key
- `name` (varchar) - Feature name (unique)
- `category` - Feature category
- `description`, `icon` - Display info
- `created_at`, `updated_at` - Timestamps

**`property_feature_assignments`** - Links properties to features
- `property_id` (UUID) - Foreign key to properties
- `feature_id` (integer) - Foreign key to property_features
- Unique constraint on (property_id, feature_id)

**`property_types`** - Property type options
- `id`, `name` (unique), `display_name`, `description`

**`property_statuses`** - Property status options
- `id`, `name` (unique), `display_name`, `description`, `color`

**`property_operation_statuses`** - Operation status options
- `id`, `name` (unique), `display_name`, `description`

**`user_saved_properties`** - User saved/favorite properties
- `user_id` - User identifier
- `property_id` (UUID) - Foreign key to properties
- `is_favorite` (boolean) - Favorite flag
- `notes` (text) - User notes
- Unique constraint on (user_id, property_id)

**`property_media`** - Media files (videos, documents, etc.)
- `id` (UUID) - Primary key
- `property_id` (UUID) - Foreign key to properties
- `media_type` - Type of media
- `url`, `storage_key` - File location
- `file_name`, `file_size`, `mime_type` - File info
- `is_primary` (boolean)
- `uploaded_at` - Upload timestamp

**`neon_auth.users_sync`** - User authentication (Neon Auth)
- `id` (text) - User ID
- `name`, `email` - User info
- `raw_json` (jsonb) - Full auth data
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Environment Setup

```bash
# Required in .env.local
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Optional: For connection pooling
DATABASE_URL_POOLED=postgresql://[user]:[password]@[host:5432]/[database]
```

### Metadata Files

Database schema metadata is available in `docs/db_metadata/`:
- `tables.csv` - All tables and schemas
- `columns.csv` - All columns with data types
- `constraints.csv` - Primary/foreign keys and constraints

To regenerate metadata:
```bash
docker run --rm postgres:17 psql "$DATABASE_URL" -c "\copy (SELECT ...) TO STDOUT WITH CSV HEADER" > docs/db_metadata/tables.csv
```

---

## 🏗️ Architecture

### Component Architecture

#### PropertyCardGrid ⭐ Main Grid Component
- **Location**: `src/ui/PropertyCardGrid.tsx`
- **Purpose**: Reusable responsive grid for displaying multiple property cards
- **Props**: `properties[]`, `onPropertyClick()`, `isSaved`, `onSaveToggle()`
- **Grid System**: Inline `display: grid` with responsive `.propertyListGrid` CSS class
- **Usage**: Home page search results, map page sidebar property list
- **Responsive Columns**: 
  - Mobile (XS-SM): 1 column
  - Tablet (MD-LG): 2-3 columns
  - Desktop (XL-2XL): 4 columns

#### PropertyCard
- **Location**: `src/ui/PropertyCard.tsx`
- **Purpose**: Individual property card display
- **Props**: Property data, click handler, save state
- **Styling**: `src/styles/PropertyCard.module.css`
- **Features**: Cover image, price, address, ratings, save button

#### PropertyDetailCard
- **Location**: `src/ui/PropertyDetailCard.tsx`
- **Purpose**: Property detail view with all information
- **Props**: Property ID, neighborhood data
- **Includes**: Full description, features, specifications, images
- **Styling**: `src/styles/PropertyDetailCard.module.css`

#### PropertyGallery
- **Location**: `src/ui/PropertyGallery.tsx`
- **Purpose**: Multi-image gallery with grid display
- **Props**: Property data
- **Features**: Grid layout, lightbox support

#### PropertyImageCarousel
- **Location**: `src/ui/PropertyImageCarousel.tsx`
- **Purpose**: Image carousel/slider
- **Library**: react-multi-carousel

#### PropertyPopup
- **Location**: `src/ui/PropertyPopup.tsx`
- **Purpose**: Modal popup for property preview
- **Usage**: Map page property preview, quick view

#### FeaturedProperties
- **Location**: `src/ui/FeaturedProperties.tsx`
- **Purpose**: Hero section featured properties
- **Grid**: `.propertyGrid` CSS class (fixed card sizes)
- **Display**: 6 featured properties with special styling

#### SearchBar & MapFilters
- **Purpose**: Filter and search functionality
- **Locations**: `src/ui/SearchBar.tsx`, `src/ui/MapFilters.tsx`
- **Features**: Price range, property type, location filters

### Utility Functions

#### propertyImageUtils.ts
Centralized image handling (all components use these):
```typescript
- sortPropertyImages(images) - Sort by cover status, then display order
- getCoverImageRaw(property) - Get cover image URL
- getPropertyImagesRaw(property, limit) - Get up to N image URLs
- getAllPropertyImagesRaw(property) - Get all image URLs
- getCoverImageObject(property) - Get PropertyImage object (not URL)
- hasValidImages(property) - Boolean validation
- getImageCount(property) - Total image count
- FALLBACK_IMAGE - `/ubika-logo.png`
```

#### formatPropertyUtils.ts
Centralized property formatting (all components use these):
```typescript
- formatPropertyPrice(price) - Full USD format (no decimals)
- formatPropertyPriceCompact(price) - Compact format (e.g., "1.2M")
- formatPropertyDate(date, format) - Customizable date formatting
- formatPropertySize(size, unit) - Area/size formatting
- formatPropertyType(typeName) - Type name with proper casing
- formatPropertyStatus(statusName) - Status display formatting
- formatPropertyAddress(address) - Combined address
- formatPropertyFullAddress(street, city, state, country) - Full address
- formatPropertyBedsBaths(beds, baths) - Bed/bath display
```

#### useResolvedImage Hook
Async image resolution for component layer:
```typescript
const { resolvedImage, isLoading } = useResolvedImage(imageUrl)
```

---

## Grid Layouts & Property Display

### Two Grid Systems

#### 1. `.propertyGrid` - Featured Properties (Fixed Card Sizes)
**File**: `src/styles/Home.module.css`
- **Card sizes**: 300-340px fixed width
- **Usage**: FeaturedProperties component in hero section
- **Display**: 6 featured properties with fixed aspect ratio
- **Responsive**: Adjusts number of visible columns
  - Phone: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns

```css
.propertyGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

#### 2. `.propertyListGrid` - Property Lists (Flexible/Responsive)
**File**: `src/styles/Home.module.css`
- **Component**: PropertyCardGrid wrapper
- **Usage**: Home page search results, map page sidebar
- **Display**: Responsive columns based on screen size
- **Columns**:
  - XS (< 360px): 1 column, gap 12px
  - SM (360-479px): 1 column, gap 16px
  - MD (480-767px): 2 columns, gap 20px
  - LG (768-1023px): 3 columns, gap 24px
  - XL-2XL (1024px+): 4 columns, gap 28px

```css
.propertyListGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--grid-gap-md);
}

@media (max-width: 479px) {
  .propertyListGrid {
    grid-template-columns: 1fr;
    gap: var(--grid-gap-sm);
  }
}
```

### Property Display Locations

| Location | Component | Grid | Responsive |
|----------|-----------|------|-----------|
| **Home Page** | PropertyCardGrid | `.propertyListGrid` | 1-4 columns |
| **Map Page Sidebar** | PropertyCardGrid | `.propertyListGrid` | 1-4 columns |
| **Featured Section** | Grid layout | `.propertyGrid` | Fixed sizes |
| **Property Detail** | PropertyGallery | Grid or carousel | Yes |

---

## 📱 Responsive Design System

### Standardized Breakpoints

| Breakpoint | Size Range | Devices | Header Height |
|-----------|-----------|---------|---------------|
| **XS** | < 360px | iPhone SE, old phones | 52px |
| **SM** | 360-479px | iPhone 12/13/14 | 56px |
| **MD** | 480-767px | Large phones, small tablets | 60px |
| **LG** | 768-1023px | iPad, tablets | 64px |
| **XL** | 1024-1439px | Laptop, small desktop | 66px |
| **2XL** | >= 1440px | Desktop, large monitors | 68px |

### CSS Variables

```css
/* Breakpoints */
--breakpoint-xs: 360px;
--breakpoint-sm: 480px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1440px;

/* Header Heights */
--header-height-xs: 52px;
--header-height-sm: 56px;
--header-height-md: 60px;
--header-height-lg: 64px;
--header-height-xl: 66px;
--header-height-2xl: 68px;

/* Content Padding */
--content-padding-xs: 8px;
--content-padding-sm: 12px;
--content-padding-md: 16px;
--content-padding-lg: 24px;
--content-padding-xl: 32px;

/* Grid Gaps */
--grid-gap-xs: 8px;
--grid-gap-sm: 12px;
--grid-gap-md: 16px;
--grid-gap-lg: 24px;
--grid-gap-xl: 32px;

/* Container Max-widths */
--container-sm: 540px;
--container-md: 720px;
--container-lg: 960px;
--container-xl: 1140px;
--container-2xl: 1320px;
```

### Implementation Patterns

#### Mobile-First Approach
```css
.component {
  padding: var(--content-padding-sm);      /* Mobile base */
}

@media (min-width: 768px) {
  .component {
    padding: var(--content-padding-lg);    /* Tablet+ */
  }
}
```

#### Responsive Grid
```css
.propertyGrid {
  grid-template-columns: 1fr;              /* Mobile: 1 column */
  gap: var(--grid-gap-sm);
}

@media (min-width: 480px) {
  .propertyGrid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
    gap: var(--grid-gap-md);
  }
}

@media (min-width: 1024px) {
  .propertyGrid {
    grid-template-columns: repeat(4, 1fr); /* Desktop: 4 columns */
    gap: var(--grid-gap-lg);
  }
}
```

### Testing Devices

- **XS**: iPhone SE (375px)
- **SM**: iPhone 12 (390px)
- **MD**: Large phone landscape (480px)
- **LG**: iPad portrait (768px)
- **XL**: Laptop (1024px, 1366px)
- **2XL**: Desktop (1440px+, 1920px+)

---

## 💻 Development Guide

### Environment Setup

1. **Clone and install**
   ```bash
   git clone <repo>
   cd ubika
   npm install
   ```

2. **Environment variables** (`.env.local`)
   ```
   DATABASE_URL=...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Database setup**
   ```bash
   npm run db:setup
   ```

### Running Development Server

```bash
npm run dev
```

Access at [http://localhost:3000](http://localhost:3000)

Features:
- Hot reload on file changes
- TypeScript type checking
- Fast refresh

### Building for Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run TypeScript check
npm run build

# Check for errors
npm run lint  # if available
```

### File Locations Cheat Sheet

| Type | Location |
|------|----------|
| Pages (App Router) | `src/app/**/*.tsx` |
| Pages (Pages Router) | `src/pages/**/*.tsx` |
| UI Components | `src/ui/` |
| Styles | `src/styles/` |
| Types | `src/types/index.ts` |
| Utilities | `src/lib/` |
| API Routes | `src/app/api/` or `src/pages/api/` |
| Tests | `src/test/` |
| Database | `src/lib/db.ts` |
| Hooks | `src/lib/use*.ts` |

### Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run db:test          # Test database connection
npm run db:setup         # Setup database
npm run db:reset         # Reset database
npm run db:list          # List properties
```

---

## 🔌 API Endpoints

### Properties

**GET `/api/properties`**
- List all properties with filters
- Query params: `skip`, `limit`, `type`, `minPrice`, `maxPrice`, `city`
- Returns: Array of properties

**POST `/api/properties`**
- Create new property (seller only)
- Body: Property data
- Returns: Created property

**GET `/api/properties/[id]`**
- Get single property details
- Params: `id` (UUID)
- Returns: Property object with images, features, neighborhood

**PUT `/api/properties/[id]`**
- Update property (seller only)
- Params: `id` (UUID)
- Body: Updated property data
- Returns: Updated property

**DELETE `/api/properties/[id]`**
- Delete property (seller only)
- Params: `id` (UUID)
- Returns: Success status

### Authentication

**POST `/api/auth/[...nextauth]`**
- NextAuth.js endpoints
- Handles: signin, signout, callback, session

**GET `/api/auth/session`**
- Get current user session
- Returns: User object or null

### Neighborhoods

**GET `/api/neighborhoods`**
- List neighborhoods
- Query params: `city`, `state`
- Returns: Array of neighborhoods

**GET `/api/neighborhoods/[id]`**
- Get neighborhood details
- Params: `id` (integer)
- Returns: Neighborhood object

### Reference Data

**GET `/api/property-features`**
- List all available features/amenities
- Returns: Array of feature objects

**GET `/api/property-statuses`**
- List property statuses
- Returns: Array of status objects

**GET `/api/property-types`**
- List property types
- Returns: Array of type objects

**GET `/api/property-operation-statuses`**
- List operation statuses
- Returns: Array of status objects

### Images & Blobs

**GET `/api/blobs/resolve`**
- Resolve blob URLs to actual image URLs
- Query params: `url`
- Returns: Resolved image URL or error

---

## 📚 File Locations Reference

### Core Application Files

```
src/app/page.tsx                    # Home page (search results with grid)
src/app/map/page.tsx                # Map page (interactive map + property list)
src/app/property/[id]/page.tsx      # Property detail page
src/app/seller/page.tsx             # Seller dashboard
src/app/layout.tsx                  # Root layout wrapper
src/pages/_app.tsx                  # App wrapper (Pages Router)
```

### UI Components by Purpose

**Property Display**
```
src/ui/PropertyCard.tsx             # Individual property card
src/ui/PropertyCardGrid.tsx         # Property grid layout wrapper ⭐
src/ui/PropertyDetailCard.tsx       # Full property details
src/ui/PropertyGallery.tsx          # Image gallery grid
src/ui/PropertyImageCarousel.tsx    # Image carousel/slider
src/ui/PropertyImageGrid.tsx        # Image grid layout
src/ui/PropertyPopup.tsx            # Property popup modal
```

**Main Layout**
```
src/ui/Header.tsx                   # Header/navbar
src/ui/Footer.tsx                   # Footer
src/ui/StandardLayout.tsx           # Standard page layout wrapper
src/ui/Banner.tsx                   # Hero banner
```

**Specialized Components**
```
src/ui/FeaturedProperties.tsx       # Featured properties hero section
src/ui/SearchBar.tsx                # Search and filter bar
src/ui/MapFilters.tsx               # Map filter sidebar
src/ui/SellerDashboard.tsx          # Seller property management
src/ui/StateComponents.tsx          # Stateful component definitions
```

### Utilities & Hooks

**Image & Formatting**
```
src/lib/propertyImageUtils.ts       # Image URL retrieval functions
src/lib/formatPropertyUtils.ts      # Property data formatting
src/lib/useResolvedImage.ts         # Async image resolution hook
src/lib/propertyImages.ts           # Image handling utilities
src/lib/blob.ts                     # Blob image utilities
```

**Core Utilities**
```
src/lib/db.ts                       # Database connection
src/lib/cache.ts                    # Caching utilities
src/lib/sessionCache.ts             # Session caching
src/lib/logger.ts                   # Logging utility
src/lib/format.ts                   # General formatting
src/lib/useMediaQuery.ts            # Media query hook
src/lib/mobileDetect.ts             # Mobile detection
```

### Styles

**Layout Styles**
```
src/styles/globals.css              # Global styles
src/styles/Layout.module.css        # Page layout styles
src/styles/Header.module.css        # Header styles
src/styles/Home.module.css          # Home page styles (large file)
src/styles/StandardLayout.module.css # Standard layout wrapper
```

**Component Styles**
```
src/styles/PropertyCard.module.css
src/styles/PropertyDetailCard.module.css
src/styles/PropertyDetail.module.css
src/styles/PropertyGallery.module.css
src/styles/SearchBar.module.css
src/styles/MapFilters.module.css
src/styles/StandardComponents.module.css
src/styles/Banner.module.css
src/styles/Mobile.module.css
src/styles/responsive.module.css    # Responsive design system variables
```

### Types

```
src/types/index.ts                  # All TypeScript types and interfaces
src/types/react-multi-carousel.d.ts # Type definitions for carousel library
```

### Database & Configuration

```
src/lib/db.ts                       # Neon database connection
docs/NEON_SCHEMA.md                 # Database schema documentation
docs/db_metadata/                   # CSV metadata exports
config/                             # Configuration files
next.config.js                      # Next.js configuration
tsconfig.json                       # TypeScript configuration
package.json                        # Dependencies and scripts
Makefile                            # Build commands
```

---

## 👥 Contributing

### Code Style Guidelines

- Use TypeScript with strict mode enabled
- Follow component naming: PascalCase (components), camelCase (functions/utilities)
- CSS class naming: camelCase in CSS Modules, snake_case for utility classes
- Use CSS variables for responsive values
- Keep components focused and reusable

### Commit Conventions

Following the project's git log pattern:

```
type: description

- Detailed explanation if needed
- Multiple bullet points for clarity
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring without feature changes
- `docs:` - Documentation updates
- `style:` - Code style changes (formatting)
- `perf:` - Performance improvements
- `test:` - Test updates
- `chore:` - Build/tooling changes

**Examples**:
```
feat: add property grid layout component
fix: resolve property image loading issue
refactor: consolidate property utilities
docs: update responsive design system
```

### Naming Conventions

**Components**: PascalCase
```typescript
PropertyCardGrid.tsx
PropertyDetailCard.tsx
SearchBar.tsx
```

**Utilities**: camelCase
```typescript
formatPropertyPrice()
getCoverImageRaw()
useResolvedImage()
```

**CSS Classes**: camelCase (scoped via CSS Modules)
```css
.propertyCard
.propertyGrid
.propertyListGrid
.statusBadge
```

**CSS Variables**: kebab-case with prefixes
```css
--header-height-sm
--content-padding-lg
--grid-gap-md
--container-2xl
```

### Pull Request Process

1. Create feature branch: `git checkout -b feature/property-grid`
2. Make changes and test locally
3. Build verification: `npm run build`
4. Commit with proper messages
5. Push and create pull request
6. Address review feedback
7. Merge when approved

---

## 🔧 Code Organization & Best Practices

### Property Code Consolidation

The codebase uses centralized utilities to eliminate duplication:

**propertyImageUtils.ts** - All image operations
- Used by: PropertyCard, PropertyDetailCard, PropertyGallery, PropertyImageCarousel, PropertyImageGrid, PropertyPopup
- Benefit: 80+ lines of duplicate code removed
- Key design: Sync functions return raw URLs; async resolution via `useResolvedImage` hook

**formatPropertyUtils.ts** - All formatting operations
- Used by: PropertyCard, PropertyDetailCard, and data display components
- Benefit: 20+ lines of duplicate code removed
- Functions: Price, date, size, type, status, address formatting

**Type Consolidation** - `src/types/index.ts`
- Centralized Property, Neighborhood, and all related types
- Eliminates interface drift across components

### Performance Optimizations

1. **Image Handling Strategy**
   - Separation of concerns: Sync URL retrieval vs. async resolution
   - Lazy loading via hooks at component layer
   - Fallback images for missing content

2. **Component Reusability**
   - PropertyCardGrid: Used on home, map, and anywhere property lists appear
   - PropertyCard: Consistent display everywhere
   - Shared utilities: All components use same formatting/image functions

3. **CSS Optimization**
   - CSS Modules prevent style conflicts
   - Responsive variables reduce repetition
   - Standardized breakpoints enable efficient testing

### Architecture Improvements

**Before Consolidation**:
- Duplicate image functions in 6 components (80+ lines)
- Duplicate formatting functions in multiple components (20+ lines)
- Duplicate Neighborhood interface in 2 places
- Inconsistent async/sync patterns

**After Consolidation**:
- Single source of truth for all property operations
- Consistent patterns across entire codebase
- 100+ lines of duplicate code removed
- Easier maintenance and feature additions

---

## ❓ Troubleshooting

### Database Connection Issues

**Error**: `Database connection failed`
- Check DATABASE_URL in `.env.local`
- Verify Neon connection string format: `postgresql://user:password@host/database`
- Test connection: `npm run db:test`

**Error**: `Can't reach database server`
- Verify internet connection
- Check Neon project is active
- Review Neon connection logs

### Build Errors

**Error**: `TypeScript compilation errors`
```bash
# Check for type errors
npm run build

# View specific errors
npx tsc --noEmit
```

**Error**: `Module not found`
- Verify import paths are correct
- Check file extensions (.ts, .tsx)
- Ensure package is installed: `npm install`

### Image Loading Issues

**Problem**: Property images not displaying
- Check image URLs are valid
- Verify blob resolution: `GET /api/blobs/resolve?url=...`
- Check browser console for CORS errors
- Fallback image shows: `/ubika-logo.png`

**Problem**: Carousel images not working
- Verify react-multi-carousel is installed
- Check PropertyImageCarousel component import
- Review image array structure

### Responsive Design Issues

**Problem**: Layout broken on mobile
- Open DevTools mobile view (F12)
- Test at breakpoints: 360px, 480px, 768px, 1024px, 1440px
- Check CSS media queries
- Verify no hardcoded pixel widths

**Problem**: Grid showing wrong number of columns
- Check `.propertyListGrid` CSS media queries
- Verify grid-template-columns values
- Test at specific breakpoints using DevTools

### Map Page Issues

**Problem**: Map not displaying
- Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
- Check API key is valid and enabled
- Review browser console for API errors
- Ensure coordinates are valid

**Problem**: Property sidebar not updating
- Check PropertyCardGrid component is properly connected
- Verify map click event handler passes property data
- Review property list props in map page

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

## 📞 Support & Resources

- **Documentation**: See sections above for feature-specific docs
- **Database Schema**: `docs/NEON_SCHEMA.md` for detailed schema information
- **Database Metadata**: `docs/db_metadata/` for CSV exports
- **Issues**: Report bugs via project issue tracker
- **Questions**: Check troubleshooting section above

---

**Last Updated**: October 23, 2025  
**Version**: 1.0  
**Build Status**: ✅ All passing
