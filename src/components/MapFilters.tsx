import React, { useState } from 'react';
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
}

const MapFilters: React.FC<MapFiltersProps> = ({ 
  onFilterChange, 
  onSearchLocationChange,
  initialFilters = {},
  showBoundaryButton = false,
  onRemoveBoundary,
  searchLocation = '',
  inHeader = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchLocation);
  const [filters, setFilters] = useState<FilterOptions>({
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

  const handlePriceChange = (min: string, max: string) => {
    const newFilters = { ...filters, priceMin: min, priceMax: max };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBedsChange = (beds: string) => {
    const newFilters = { ...filters, beds };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBathsChange = (baths: string) => {
    const newFilters = { ...filters, baths };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleHomeTypeChange = (homeType: string) => {
    const newFilters = { ...filters, homeType };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleOperationChange = (operation: string) => {
    const newFilters = { ...filters, operation };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMoreFiltersChange = (newMoreFilters: FilterOptions['moreFilters']) => {
    const newFilters = { ...filters, moreFilters: newMoreFilters };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.${styles.singleDropdown}`) && !target.closest(`.${styles.singleDropdownButton}`)) {
      setIsDropdownOpen(false);
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
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Helper to check if any filter is active
  const hasActiveFilters = filters.operation || filters.priceMin || filters.priceMax || 
                          filters.beds || filters.baths || filters.homeType ||
                          filters.moreFilters.minArea || filters.moreFilters.maxArea || 
                          filters.moreFilters.yearBuiltMin || filters.moreFilters.yearBuiltMax ||
                          filters.moreFilters.keywords.length > 0;

  return (
    <div className={`${styles.filtersContainer} ${inHeader ? styles.headerFilters : ''}`} onClick={handleClickOutside}>
      {/* Single Unified Filter Dropdown */}
      <div className={styles.filterGroup}>
        <button 
          className={`${styles.singleDropdownButton} ${isDropdownOpen ? styles.active : ''} ${hasActiveFilters ? styles.hasFilter : ''}`}
          onClick={handleDropdownToggle}
        >
          🔍
          {hasActiveFilters && <span className={styles.filterBadge}></span>}
        </button>
        
        {isDropdownOpen && (
          <div className={`${styles.singleDropdown} ${styles.allFiltersDropdown}`}>
            
            {/* Operation Filter Section */}
            <div className={styles.filterSection}>
              <h4>Type</h4>
              <div className={styles.btnGroup}>
                <button 
                  className={filters.operation === 'buy' ? styles.selected : ''} 
                  onClick={() => handleOperationChange('buy')}
                >
                  For Sale
                </button>
                <button 
                  className={filters.operation === 'rent' ? styles.selected : ''} 
                  onClick={() => handleOperationChange('rent')}
                >
                  For Rent
                </button>
              </div>
            </div>

            {/* Price Filter Section */}
            <div className={styles.filterSection}>
              <h4>Price Range</h4>
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
                <button onClick={() => handlePriceChange('', '')}>Any</button>
                <button onClick={() => handlePriceChange('', '100000')}>Under $100k</button>
                <button onClick={() => handlePriceChange('100000', '300000')}>$100k-$300k</button>
                <button onClick={() => handlePriceChange('300000', '500000')}>$300k-$500k</button>
                <button onClick={() => handlePriceChange('500000', '')}>$500k+</button>
              </div>
            </div>

            {/* Beds & Baths Section */}
            <div className={styles.filterSection}>
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

            {/* Home Type Section */}
            <div className={styles.filterSection}>
              <h4>Property Type</h4>
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

            {/* Advanced Filters Section */}
            <div className={styles.filterSection}>
              <h4>Square Feet</h4>
              <div className={styles.rangeFilter}>
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filters.moreFilters.minArea}
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
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    maxArea: e.target.value
                  })}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4>Year Built</h4>
              <div className={styles.rangeFilter}>
                <input 
                  type="number" 
                  placeholder="Min"
                  value={filters.moreFilters.yearBuiltMin}
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
                  onChange={(e) => handleMoreFiltersChange({
                    ...filters.moreFilters,
                    yearBuiltMax: e.target.value
                  })}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button 
                className={styles.clearButton}
                onClick={clearAllFilters}
              >
                Clear All
              </button>
              <button 
                className={styles.applyButton}
                onClick={() => setIsDropdownOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilters;
