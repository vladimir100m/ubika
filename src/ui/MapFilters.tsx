"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/MapFilters.module.css';

export interface FilterOptions {
  sold: boolean;
  operation: string;
  priceMin: string;
  priceMax: string;
  beds: string;
  baths: string;
  homeType: string;
  moreFilters: {
    minArea: string;
    maxArea: string;
    yearBuiltMin: string;
    yearBuiltMax: string;
    keywords: string[];
  }
}

interface MapFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  onSearchLocationChange?: (location: string) => void;
  initialFilters?: Partial<FilterOptions>;
  propertyCount?: number;
  showBoundaryButton?: boolean;
  onRemoveBoundary?: () => void;
  searchLocation?: string;
  inHeader?: boolean;
  onClosePopup?: () => void;
}

const MapFilters: React.FC<MapFiltersProps> = ({ 
  onFilterChange, 
  onSearchLocationChange,
  initialFilters = {},
  showBoundaryButton = false,
  onRemoveBoundary,
  searchLocation = '',
  inHeader = false,
  onClosePopup
}) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchLocation);
  const [isSearching, setIsSearching] = useState(false);
  const [hideSearchForm, setHideSearchForm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Applied filters (what's currently active in the database)
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({
    sold: initialFilters.sold || false,
    operation: initialFilters.operation || '',
    priceMin: initialFilters.priceMin || '',
    priceMax: initialFilters.priceMax || '',
    beds: initialFilters.beds || '',
    baths: initialFilters.baths || '',
    homeType: initialFilters.homeType || '',
    moreFilters: {
      minArea: initialFilters.moreFilters?.minArea || '',
      maxArea: initialFilters.moreFilters?.maxArea || '',
      yearBuiltMin: initialFilters.moreFilters?.yearBuiltMin || '',
      yearBuiltMax: initialFilters.moreFilters?.yearBuiltMax || '',
      keywords: initialFilters.moreFilters?.keywords || [],
    }
  });

  // Temporary filters (what's being modified in the UI)
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    sold: initialFilters.sold || false,
    operation: initialFilters.operation || '',
    priceMin: initialFilters.priceMin || '',
    priceMax: initialFilters.priceMax || '',
    beds: initialFilters.beds || '',
    baths: initialFilters.baths || '',
    homeType: initialFilters.homeType || '',
    moreFilters: {
      minArea: initialFilters.moreFilters?.minArea || '',
      maxArea: initialFilters.moreFilters?.maxArea || '',
      yearBuiltMin: initialFilters.moreFilters?.yearBuiltMin || '',
      yearBuiltMax: initialFilters.moreFilters?.yearBuiltMax || '',
      keywords: initialFilters.moreFilters?.keywords || [],
    }
  });

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Update temporary filters only (no immediate database query)
  const handlePriceChange = (min: string, max: string) => {
    setTempFilters({ ...tempFilters, priceMin: min, priceMax: max });
  };

  const handleBedsChange = (beds: string) => {
    setTempFilters({ ...tempFilters, beds });
  };

  const handleBathsChange = (baths: string) => {
    setTempFilters({ ...tempFilters, baths });
  };

  const handleHomeTypeChange = (homeType: string) => {
    setTempFilters({ ...tempFilters, homeType });
  };

  const handleOperationChange = (operation: string) => {
    setTempFilters({ ...tempFilters, operation });
  };

  const handleMoreFiltersChange = (newMoreFilters: FilterOptions['moreFilters']) => {
    setTempFilters({ ...tempFilters, moreFilters: newMoreFilters });
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.${styles.singleDropdown}`) && !target.closest(`.${styles.singleDropdownButton}`)) {
      setIsDropdownOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (!onSearchLocationChange) return;
    // Debounced change to avoid excessive queries
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      onSearchLocationChange(value.trim());
      setIsSearching(false);
    }, 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (onSearchLocationChange) {
      onSearchLocationChange(searchValue.trim());
    }
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    if (onSearchLocationChange) {
      onSearchLocationChange('');
    }
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // Allow ESC to clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchValue) {
        handleClearSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current as ReturnType<typeof setTimeout>);
        debounceRef.current = null;
      }
    };
  }, [searchValue]);

  const handleRemoveBoundary = () => {
    setSearchValue('');
    if (onRemoveBoundary) {
      onRemoveBoundary();
    }
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      sold: false,
      operation: '',
      priceMin: '',
      priceMax: '',
      beds: '',
      baths: '',
      homeType: '',
      moreFilters: {
        minArea: '',
        maxArea: '',
        yearBuiltMin: '',
        yearBuiltMax: '',
        keywords: [],
      }
    };
  setTempFilters(clearedFilters);
  setAppliedFilters(clearedFilters);
  onFilterChange(clearedFilters);
  // Do NOT close the popup here; just clear the form
  };

  // Apply filters function - this triggers the database query
  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    onFilterChange(tempFilters);
    setIsDropdownOpen(false);
    
    // Close popup if onClosePopup is provided (for external popup control)
    if (onClosePopup) {
      onClosePopup();
    }

    // Navigate to /map with equivalent query params so the map view shows filtered results
    const query: any = {};
    if (tempFilters.operation) query.operation = tempFilters.operation;
    if (tempFilters.priceMin) query.minPrice = tempFilters.priceMin;
    if (tempFilters.priceMax) query.maxPrice = tempFilters.priceMax;
    if (tempFilters.beds) query.bedrooms = tempFilters.beds;
    if (tempFilters.baths) query.bathrooms = tempFilters.baths;
    if (tempFilters.homeType) query.propertyType = tempFilters.homeType;
    if (tempFilters.moreFilters.minArea) query.minArea = tempFilters.moreFilters.minArea;
    if (tempFilters.moreFilters.maxArea) query.maxArea = tempFilters.moreFilters.maxArea;

  // Use router.push to navigate; build a query string since app-router push takes a URL
  const queryKeys = Object.keys(query);
  const queryString = queryKeys.length ? `?${new URLSearchParams(query).toString()}` : '';
  router.push(`/map${queryString}`);

    // Hide the inline search form element when filters are applied
    setHideSearchForm(true);
  };

  // Check if there are active filters based on applied filters
  const hasActiveFilters = appliedFilters.operation || appliedFilters.priceMin || appliedFilters.priceMax ||
                          appliedFilters.beds || appliedFilters.baths || appliedFilters.homeType ||
                          appliedFilters.moreFilters.minArea || appliedFilters.moreFilters.maxArea || 
                          appliedFilters.moreFilters.yearBuiltMin || appliedFilters.moreFilters.yearBuiltMax ||
                          appliedFilters.moreFilters.keywords.length > 0;

  // Check if there are unsaved changes in temporary filters
  const hasUnsavedChanges = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);


  return (
  <div className={styles.searchSection}>
      {/* Search Bar Section (now at the top) */}
      {!hideSearchForm && (
        <form onSubmit={handleSearchSubmit} className={styles.searchForm} role="search" aria-label="Property location search">
          <div className={styles.searchBarWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Search city, neighborhood or address"
              value={searchValue}
              onChange={handleSearchChange}
              className={styles.searchInput}
              aria-label="Search location"
              autoComplete="off"
            />
            {searchValue && (
              <button
                type="button"
                className={styles.clearSearchButton}
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button type="submit" className={styles.submitSearchButton} aria-label="Submit search">
              Go
            </button>
          </div>
        </form>
      )}
      {isSearching && (
        <span className={styles.searchStatus} aria-live="polite">Searching…</span>
      )}
      {showBoundaryButton && (
        <button 
          className={styles.removeBoundaryButton}
          onClick={handleRemoveBoundary}
        >
          ✕ Remove Search Area
        </button>
      )}

      {/* Operation Type Filter Section */}
      <div className={styles.filterSection} style={{ marginBottom: 18 }}>
        <div className={styles.sectionTitle}>Tipo de operación</div>
        <div className={styles.buttonGrid} style={{ maxWidth: 260 }}>
          <button
            type="button"
            className={
              tempFilters.operation === 'rent'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.operation === 'rent'}
            onClick={() => handleOperationChange('rent')}
          >
            Alquilar
          </button>
          <button
            type="button"
            className={
              tempFilters.operation === 'buy'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.operation === 'buy'}
            onClick={() => handleOperationChange('buy')}
          >
            Comprar
          </button>
        </div>
      </div>

      {/* Price Filter Section */}
      <div className={styles.filterSection} style={{ marginBottom: 18 }}>
        <div className={styles.sectionTitle}>Precio</div>
        <div className={styles.buttonGrid} style={{ maxWidth: 340 }}>
          <button
            type="button"
            className={
              tempFilters.priceMax === '1000'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.priceMax === '1000'}
            onClick={() => handlePriceChange('', '1000')}
          >
            {'< $1000'}
          </button>
          <button
            type="button"
            className={
              tempFilters.priceMin === '1000' && tempFilters.priceMax === '2000'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.priceMin === '1000' && tempFilters.priceMax === '2000'}
            onClick={() => handlePriceChange('1000', '2000')}
          >
            {'$1000 - $2000'}
          </button>
          <button
            type="button"
            className={
              tempFilters.priceMin === '2000' && tempFilters.priceMax === '3000'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.priceMin === '2000' && tempFilters.priceMax === '3000'}
            onClick={() => handlePriceChange('2000', '3000')}
          >
            {'$2000 - $3000'}
          </button>
          <button
            type="button"
            className={
              tempFilters.priceMin === '3000' && tempFilters.priceMax === ''
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.priceMin === '3000' && tempFilters.priceMax === ''}
            onClick={() => handlePriceChange('3000', '')}
          >
            {'> $3000'}
          </button>
        </div>
      </div>

      {/* Bethrooms Filter Section */}
      <div className={styles.filterSection} style={{ marginBottom: 18 }}>
        <div className={styles.sectionTitle}>Baños</div>
        <div className={styles.buttonGrid} style={{ maxWidth: 260 }}>
          <button
            type="button"
            className={
              tempFilters.baths === '1'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.baths === '1'}
            onClick={() => handleBathsChange('1')}
          >
            1+
          </button>
          <button
            type="button"
            className={
              tempFilters.baths === '2'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.baths === '2'}
            onClick={() => handleBathsChange('2')}
          >
            2+
          </button>
          <button
            type="button"
            className={
              tempFilters.baths === '3'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.baths === '3'}
            onClick={() => handleBathsChange('3')}
          >
            3+
          </button>
          <button
            type="button"
            className={
              tempFilters.baths === '4'
                ? `${styles.optionBtn} ${styles.optionSelected}`
                : styles.optionBtn
            }
            aria-pressed={tempFilters.baths === '4'}
            onClick={() => handleBathsChange('4')}
          >
            4+
          </button>
        </div>
  </div>
      {/* Action Buttons Section (bottom) */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={styles.clearButton}
          onClick={clearAllFilters}
        >
          Limpiar filtros
        </button>
        <button
          type="button"
          className={styles.applyButton}
          onClick={applyFilters}
          disabled={!hasUnsavedChanges}
          aria-disabled={!hasUnsavedChanges}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default MapFilters;
