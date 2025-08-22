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

  const hasActiveFilters = filters.operation || filters.priceMin || filters.priceMax || 
                          filters.beds || filters.baths || filters.homeType ||
                          filters.moreFilters.minArea || filters.moreFilters.maxArea || 
                          filters.moreFilters.yearBuiltMin || filters.moreFilters.yearBuiltMax ||
                          filters.moreFilters.keywords.length > 0;

  // Render function for filter sections (used in both header dropdown and popup)
  const renderFilterSections = () => (
    <>
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

      {/* Beds Filter Section */}
      <div className={styles.filterSection}>
        <h4>Bedrooms</h4>
        <div className={styles.btnGroup}>
          <button 
            className={filters.beds === '' ? styles.selected : ''} 
            onClick={() => handleBedsChange('')}
          >
            Any
          </button>
          <button 
            className={filters.beds === '1+' ? styles.selected : ''} 
            onClick={() => handleBedsChange('1+')}
          >
            1+
          </button>
          <button 
            className={filters.beds === '2+' ? styles.selected : ''} 
            onClick={() => handleBedsChange('2+')}
          >
            2+
          </button>
          <button 
            className={filters.beds === '3+' ? styles.selected : ''} 
            onClick={() => handleBedsChange('3+')}
          >
            3+
          </button>
          <button 
            className={filters.beds === '4+' ? styles.selected : ''} 
            onClick={() => handleBedsChange('4+')}
          >
            4+
          </button>
        </div>
      </div>

      {/* Baths Filter Section */}
      <div className={styles.filterSection}>
        <h4>Bathrooms</h4>
        <div className={styles.btnGroup}>
          <button 
            className={filters.baths === '' ? styles.selected : ''} 
            onClick={() => handleBathsChange('')}
          >
            Any
          </button>
          <button 
            className={filters.baths === '1+' ? styles.selected : ''} 
            onClick={() => handleBathsChange('1+')}
          >
            1+
          </button>
          <button 
            className={filters.baths === '2+' ? styles.selected : ''} 
            onClick={() => handleBathsChange('2+')}
          >
            2+
          </button>
          <button 
            className={filters.baths === '3+' ? styles.selected : ''} 
            onClick={() => handleBathsChange('3+')}
          >
            3+
          </button>
        </div>
      </div>

      {/* Home Type Filter Section */}
      <div className={styles.filterSection}>
        <h4>Home Type</h4>
        <div className={styles.btnGroup}>
          <button 
            className={filters.homeType === 'house' ? styles.selected : ''} 
            onClick={() => handleHomeTypeChange('house')}
          >
            House
          </button>
          <button 
            className={filters.homeType === 'apartment' ? styles.selected : ''} 
            onClick={() => handleHomeTypeChange('apartment')}
          >
            Apartment
          </button>
          <button 
            className={filters.homeType === 'condo' ? styles.selected : ''} 
            onClick={() => handleHomeTypeChange('condo')}
          >
            Condo
          </button>
          <button 
            className={filters.homeType === 'villa' ? styles.selected : ''} 
            onClick={() => handleHomeTypeChange('villa')}
          >
            Villa
          </button>
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
    </>
  );

  return (
    <div className={`${styles.filtersContainer} ${inHeader ? styles.headerFilters : styles.popupFilters}`} onClick={handleClickOutside}>
      {/* Search Location Input - Only show in popup mode */}
      {!inHeader && (
        <div className={styles.searchSection}>
          <h4 className={styles.sectionTitle}>Search Location</h4>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Enter address, city, or neighborhood..."
              value={searchValue}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
          {showBoundaryButton && (
            <button 
              className={styles.removeBoundaryButton}
              onClick={handleRemoveBoundary}
            >
              Remove Search Area
            </button>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        {/* Header for popup mode */}
        {!inHeader && (
          <h4 className={styles.sectionTitle}>Property Filters</h4>
        )}
        
        {/* Single Unified Filter Dropdown for header mode, or expanded filters for popup */}
        {inHeader ? (
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
                {renderFilterSections()}
              </div>
            )}
          </div>
        ) : (
          // Popup mode - show expanded filters directly
          <div className={styles.expandedFilters}>
            {renderFilterSections()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilters;
