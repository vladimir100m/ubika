import React, { useState } from 'react';
import styles from '../styles/MapFilters.module.css';

export interface FilterOptions {
  forSale: boolean;
  forRent: boolean;
  sold: boolean;
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
}

const MapFilters: React.FC<MapFiltersProps> = ({ 
  onFilterChange, 
  onSearchLocationChange,
  initialFilters = {},
  showBoundaryButton = false,
  onRemoveBoundary,
  searchLocation = ''
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(searchLocation);
  const [filters, setFilters] = useState<FilterOptions>({
    forSale: initialFilters.forSale || false,
    forRent: initialFilters.forRent || true,
    sold: initialFilters.sold || false,
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

  const handleDropdownToggle = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handlePropertyStatusChange = (status: 'forSale' | 'forRent' | 'sold') => {
    const newFilters = {
      ...filters,
      forSale: status === 'forSale',
      forRent: status === 'forRent',
      sold: status === 'sold'
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveDropdown(null);
  };

  const handlePriceChange = (min: string, max: string, closePopup = false) => {
    const newFilters = { ...filters, priceMin: min, priceMax: max };
    setFilters(newFilters);
    onFilterChange(newFilters);
    if (closePopup) {
      setActiveDropdown(null);
    }
  };

  const handleBedsChange = (beds: string) => {
    const newFilters = { ...filters, beds };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveDropdown(null);
  };

  const handleBathsChange = (baths: string) => {
    const newFilters = { ...filters, baths };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveDropdown(null);
  };

  const handleHomeTypeChange = (homeType: string) => {
    const newFilters = { ...filters, homeType };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveDropdown(null);
  };

  const handleMoreFiltersChange = (newMoreFilters: FilterOptions['moreFilters']) => {
    const newFilters = { ...filters, moreFilters: newMoreFilters };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.${styles.dropdown}`) && !target.closest(`.${styles.dropdownButton}`)) {
      setActiveDropdown(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchLocationChange) {
      onSearchLocationChange(e.target.value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchLocationChange) {
      onSearchLocationChange(searchValue);
    }
  };

  const handleRemoveBoundary = () => {
    setSearchValue('');
    if (onRemoveBoundary) {
      onRemoveBoundary();
    }
  };

  // Helper to check if any filter is active to display badges
  const isPriceFilterActive = filters.priceMin || filters.priceMax;
  const isBedsFilterActive = filters.beds !== '';
  const isBathsFilterActive = filters.baths !== '';
  const isHomeTypeFilterActive = filters.homeType !== '';
  const isMoreFiltersActive = filters.moreFilters.minArea || filters.moreFilters.maxArea || 
                            filters.moreFilters.yearBuiltMin || filters.moreFilters.yearBuiltMax ||
                            filters.moreFilters.keywords.length > 0;

  return (
    <div className={styles.filtersContainer} onClick={handleClickOutside}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input 
            type="text" 
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search location..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
        {showBoundaryButton && searchValue && (
          <button className={styles.removeBoundaryButton} onClick={handleRemoveBoundary}>
            Remove Boundary
          </button>
        )}
      </div>

      {/* For Sale/Rent/Sold Filter */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.dropdownButton} ${activeDropdown === 'forRent' ? styles.active : ''}`}
          onClick={() => handleDropdownToggle('forRent')}
        >
          {filters.forSale ? 'For Sale' : filters.forRent ? 'For Rent' : 'Sold'}
          <span className={styles.chevron}>▼</span>
        </button>
        {activeDropdown === 'forRent' && (
          <div className={styles.dropdown}>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                name="propertyStatus" 
                checked={filters.forSale} 
                onChange={() => handlePropertyStatusChange('forSale')} 
              />
              For Sale
            </label>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                name="propertyStatus" 
                checked={filters.forRent} 
                onChange={() => handlePropertyStatusChange('forRent')} 
              />
              For Rent
            </label>
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.dropdownButton} ${activeDropdown === 'price' ? styles.active : ''} ${isPriceFilterActive ? styles.hasFilter : ''}`}
          onClick={() => handleDropdownToggle('price')}
        >
          Price
          {isPriceFilterActive && <span className={styles.filterBadge}></span>}
          <span className={styles.chevron}>▼</span>
        </button>
        {activeDropdown === 'price' && (
          <div className={styles.dropdown}>
            <div className={styles.rangeFilter}>
              <input 
                type="text" 
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => handlePriceChange(e.target.value, filters.priceMax)}
                className={styles.rangeInput}
              />
              <span className={styles.rangeSeparator}>to</span>
              <input 
                type="text" 
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => handlePriceChange(filters.priceMin, e.target.value)}
                className={styles.rangeInput}
              />
            </div>
            <div className={styles.presetRanges}>
              <button onClick={() => handlePriceChange('', '', true)}>Any</button>
              <button onClick={() => handlePriceChange('', '100000', true)}>Under $100,000</button>
              <button onClick={() => handlePriceChange('100000', '300000', true)}>$100k-$300k</button>
              <button onClick={() => handlePriceChange('300000', '500000', true)}>$300k-$500k</button>
              <button onClick={() => handlePriceChange('500000', '', true)}>$500k+</button>
            </div>
          </div>
        )}
      </div>

      {/* Beds & Baths Filter */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.dropdownButton} ${activeDropdown === 'bedsBaths' ? styles.active : ''} ${isBedsFilterActive || isBathsFilterActive ? styles.hasFilter : ''}`}
          onClick={() => handleDropdownToggle('bedsBaths')}
        >
          Beds & Baths
          {(isBedsFilterActive || isBathsFilterActive) && <span className={styles.filterBadge}></span>}
          <span className={styles.chevron}>▼</span>
        </button>
        {activeDropdown === 'bedsBaths' && (
          <div className={styles.dropdown}>
            <div className={styles.bedsAndBaths}>
              <div className={styles.bedsFilter}>
                <h4>Bedrooms</h4>
                <div className={styles.btnGroup}>
                  <button 
                    className={filters.beds === '' ? styles.selected : ''} 
                    onClick={() => handleBedsChange('')}
                  >
                    Any
                  </button>
                  {['1', '2', '3', '4', '5+'].map((num) => (
                    <button 
                      key={num} 
                      className={filters.beds === num ? styles.selected : ''} 
                      onClick={() => handleBedsChange(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.bathsFilter}>
                <h4>Bathrooms</h4>
                <div className={styles.btnGroup}>
                  <button 
                    className={filters.baths === '' ? styles.selected : ''} 
                    onClick={() => handleBathsChange('')}
                  >
                    Any
                  </button>
                  {['1', '1.5', '2', '3', '4+'].map((num) => (
                    <button 
                      key={num} 
                      className={filters.baths === num ? styles.selected : ''} 
                      onClick={() => handleBathsChange(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Home Type Filter */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.dropdownButton} ${activeDropdown === 'homeType' ? styles.active : ''} ${isHomeTypeFilterActive ? styles.hasFilter : ''}`}
          onClick={() => handleDropdownToggle('homeType')}
        >
          Home Type
          {isHomeTypeFilterActive && <span className={styles.filterBadge}></span>}
          <span className={styles.chevron}>▼</span>
        </button>
        {activeDropdown === 'homeType' && (
          <div className={styles.dropdown}>
            <div className={styles.homeTypes}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="radio" 
                  name="homeType" 
                  checked={filters.homeType === ''} 
                  onChange={() => handleHomeTypeChange('')} 
                />
                Any
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="radio" 
                  name="homeType" 
                  checked={filters.homeType === 'House'} 
                  onChange={() => handleHomeTypeChange('House')} 
                />
                House
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="radio" 
                  name="homeType" 
                  checked={filters.homeType === 'Apartment'} 
                  onChange={() => handleHomeTypeChange('Apartment')} 
                />
                Apartment
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="radio" 
                  name="homeType" 
                  checked={filters.homeType === 'Condo'} 
                  onChange={() => handleHomeTypeChange('Condo')} 
                />
                Condo
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="radio" 
                  name="homeType" 
                  checked={filters.homeType === 'Townhouse'} 
                  onChange={() => handleHomeTypeChange('Townhouse')} 
                />
                Townhouse
              </label>
            </div>
          </div>
        )}
      </div>

      {/* More Filters */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.dropdownButton} ${activeDropdown === 'moreFilters' ? styles.active : ''} ${isMoreFiltersActive ? styles.hasFilter : ''}`}
          onClick={() => handleDropdownToggle('moreFilters')}
        >
          More
          {isMoreFiltersActive && <span className={styles.filterBadge}></span>}
          <span className={styles.chevron}>▼</span>
        </button>
        {activeDropdown === 'moreFilters' && (
          <div className={`${styles.dropdown} ${styles.moreFiltersDropdown}`}>
            <div className={styles.moreFiltersSection}>
              <h4>Square Feet</h4>
              <div className={styles.rangeFilter}>
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filters.moreFilters.minArea}
                  maxLength={10}
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    minArea: e.target.value
                  })}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeSeparator}>to</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filters.moreFilters.maxArea}
                  maxLength={10}
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    maxArea: e.target.value
                  })}
                  className={styles.rangeInput}
                />
              </div>
            </div>
            <div className={styles.moreFiltersSection}>
              <h4>Year Built</h4>
              <div className={styles.rangeFilter}>
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filters.moreFilters.yearBuiltMin}
                  maxLength={10}
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    yearBuiltMin: e.target.value
                  })}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeSeparator}>to</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filters.moreFilters.yearBuiltMax}
                  maxLength={10}
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    yearBuiltMax: e.target.value
                  })}
                  className={styles.rangeInput}
                />
              </div>
            </div>
            <button 
              className={styles.applyButton}
              onClick={() => setActiveDropdown(null)}
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilters;
