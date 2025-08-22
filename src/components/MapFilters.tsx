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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchLocation);
  
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
    setTempFilters(clearedFilters);
    // Optionally apply cleared filters immediately and close popup
    setAppliedFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setIsDropdownOpen(false);
    
    // Close popup if onClosePopup is provided (for external popup control)
    if (onClosePopup) {
      onClosePopup();
    }
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
  };

  // Check if there are active filters based on applied filters
  const hasActiveFilters = appliedFilters.operation || appliedFilters.priceMin || appliedFilters.priceMax ||
                          appliedFilters.beds || appliedFilters.baths || appliedFilters.homeType ||
                          appliedFilters.moreFilters.minArea || appliedFilters.moreFilters.maxArea || 
                          appliedFilters.moreFilters.yearBuiltMin || appliedFilters.moreFilters.yearBuiltMax ||
                          appliedFilters.moreFilters.keywords.length > 0;

  // Check if there are unsaved changes in temporary filters
  const hasUnsavedChanges = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);

  // Render function for filter sections (used in both header dropdown and popup)
  const renderFilterSections = () => (
    <>
      {/* Quick Filter Chips - Most Common Filters */}
      <div className={styles.quickFilters}>
  <h4 className={styles.propertyTitle}>Quick Filters</h4>
        <div className={styles.chipGroup}>
          <button 
            className={`${styles.filterChip} ${tempFilters.operation === 'rent' ? styles.chipSelected : ''}`}
            onClick={() => handleOperationChange(tempFilters.operation === 'rent' ? '' : 'rent')}
          >
            🏠 For Rent
          </button>
          <button 
            className={`${styles.filterChip} ${tempFilters.operation === 'buy' ? styles.chipSelected : ''}`}
            onClick={() => handleOperationChange(tempFilters.operation === 'buy' ? '' : 'buy')}
          >
            🏡 For Sale
          </button>
          <button 
            className={`${styles.filterChip} ${tempFilters.beds === '2+' ? styles.chipSelected : ''}`}
            onClick={() => handleBedsChange(tempFilters.beds === '2+' ? '' : '2+')}
          >
            🛏️ 2+ Beds
          </button>
          <button 
            className={`${styles.filterChip} ${tempFilters.homeType === 'apartment' ? styles.chipSelected : ''}`}
            onClick={() => handleHomeTypeChange(tempFilters.homeType === 'apartment' ? '' : 'apartment')}
          >
            🏢 Apartments
          </button>
        </div>
      </div>

      {/* Price Range with Visual Slider */}
      <div className={styles.filterSection}>
  <h4 className={styles.propertyTitle}>
          💰 Price Range
          {(tempFilters.priceMin || tempFilters.priceMax) && (
            <span className={styles.activeIndicator}>
              {tempFilters.priceMin && `$${Number(tempFilters.priceMin).toLocaleString()}`}
              {tempFilters.priceMin && tempFilters.priceMax && ' - '}
              {tempFilters.priceMax && `$${Number(tempFilters.priceMax).toLocaleString()}`}
            </span>
          )}
        </h4>
        <div className={styles.priceContainer}>
          <div className={styles.rangeInputs}>
            <div className={styles.inputGroup}>
              <label>Min Price</label>
              <input 
                type="number" 
                placeholder="Any"
                value={tempFilters.priceMin}
                onChange={(e) => handlePriceChange(e.target.value, tempFilters.priceMax)}
                className={styles.priceInput}
              />
            </div>
            <div className={styles.rangeDivider}>to</div>
            <div className={styles.inputGroup}>
              <label>Max Price</label>
              <input 
                type="number" 
                placeholder="Any"
                value={tempFilters.priceMax}
                onChange={(e) => handlePriceChange(tempFilters.priceMin, e.target.value)}
                className={styles.priceInput}
              />
            </div>
          </div>
          <div className={styles.pricePresets}>
            <button 
              className={`${styles.presetBtn} ${!tempFilters.priceMin && !tempFilters.priceMax ? styles.presetActive : ''}`}
              onClick={() => handlePriceChange('', '')}
            >
              Any Price
            </button>
            <button 
              className={`${styles.presetBtn} ${tempFilters.priceMax === '100000' && !tempFilters.priceMin ? styles.presetActive : ''}`}
              onClick={() => handlePriceChange('', '100000')}
            >
              Under $100K
            </button>
            <button 
              className={`${styles.presetBtn} ${tempFilters.priceMin === '100000' && tempFilters.priceMax === '300000' ? styles.presetActive : ''}`}
              onClick={() => handlePriceChange('100000', '300000')}
            >
              $100K - $300K
            </button>
            <button 
              className={`${styles.presetBtn} ${tempFilters.priceMin === '300000' && tempFilters.priceMax === '500000' ? styles.presetActive : ''}`}
              onClick={() => handlePriceChange('300000', '500000')}
            >
              $300K - $500K
            </button>
            <button 
              className={`${styles.presetBtn} ${tempFilters.priceMin === '500000' && !tempFilters.priceMax ? styles.presetActive : ''}`}
              onClick={() => handlePriceChange('500000', '')}
            >
              $500K+
            </button>
          </div>
        </div>
      </div>

      {/* Bedrooms & Bathrooms in one row */}
      <div className={styles.twoColumnSection}>
        <div className={styles.filterSection}>
          <h4 className={styles.propertyTitle}>
            🛏️ Bedrooms
            {tempFilters.beds && <span className={styles.activeIndicator}>{tempFilters.beds}</span>}
          </h4>
          <div className={styles.buttonGrid}>
            {['Any', '1+', '2+', '3+', '4+', '5+'].map((bed) => (
              <button 
                key={bed}
                className={`${styles.optionBtn} ${tempFilters.beds === (bed === 'Any' ? '' : bed) ? styles.optionSelected : ''}`} 
                onClick={() => handleBedsChange(bed === 'Any' ? '' : bed)}
              >
                {bed}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <h4 className={styles.propertyTitle}>
            🚿 Bathrooms
            {tempFilters.baths && <span className={styles.activeIndicator}>{tempFilters.baths}</span>}
          </h4>
          <div className={styles.buttonGrid}>
            {['Any', '1+', '2+', '3+', '4+'].map((bath) => (
              <button 
                key={bath}
                className={`${styles.optionBtn} ${tempFilters.baths === (bath === 'Any' ? '' : bath) ? styles.optionSelected : ''}`} 
                onClick={() => handleBathsChange(bath === 'Any' ? '' : bath)}
              >
                {bath}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Type with Icons */}
      <div className={styles.filterSection}>
  <h4 className={styles.propertyTitle}>
          🏠 Property Type
          {tempFilters.homeType && <span className={styles.activeIndicator}>{tempFilters.homeType}</span>}
        </h4>
        <div className={styles.propertyTypeGrid}>
          {[
            { type: '', icon: '🏘️', label: 'All Types' },
            { type: 'house', icon: '🏠', label: 'House' },
            { type: 'apartment', icon: '🏢', label: 'Apartment' },
            { type: 'condo', icon: '🏬', label: 'Condo' },
            { type: 'villa', icon: '🏛️', label: 'Villa' },
            { type: 'loft', icon: '🏭', label: 'Loft' },
            { type: 'duplex', icon: '🏘️', label: 'Duplex' }
          ].map(({ type, icon, label }) => (
            <button 
              key={type}
              className={`${styles.propertyTypeBtn} ${tempFilters.homeType === type ? styles.propertyTypeSelected : ''}`} 
              onClick={() => handleHomeTypeChange(type)}
            >
              <span className={styles.propertyIcon}>{icon}</span>
              <span className={styles.propertyLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className={styles.advancedSection}>
  <h4 className={styles.propertyTitle}>📐 Advanced Filters</h4>
        
        <div className={styles.twoColumnSection}>
          <div className={styles.filterSection}>
            <label className={styles.inputLabel}>
              📏 Square Feet
              {(tempFilters.moreFilters.minArea || tempFilters.moreFilters.maxArea) && (
                <span className={styles.activeIndicator}>
                  {tempFilters.moreFilters.minArea && `${tempFilters.moreFilters.minArea} sqft`}
                  {tempFilters.moreFilters.minArea && tempFilters.moreFilters.maxArea && ' - '}
                  {tempFilters.moreFilters.maxArea && `${tempFilters.moreFilters.maxArea} sqft`}
                </span>
              )}
            </label>
            <div className={styles.rangeInputs}>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  placeholder="Min sqft"
                  value={tempFilters.moreFilters.minArea}
                  onChange={(e) => handleMoreFiltersChange({
                    ...tempFilters.moreFilters,
                    minArea: e.target.value
                  })}
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.rangeDivider}>to</div>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  placeholder="Max sqft"
                  value={tempFilters.moreFilters.maxArea}
                  onChange={(e) => handleMoreFiltersChange({
                    ...tempFilters.moreFilters,
                    maxArea: e.target.value
                  })}
                  className={styles.numberInput}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.inputLabel}>
              🏗️ Year Built
              {(tempFilters.moreFilters.yearBuiltMin || tempFilters.moreFilters.yearBuiltMax) && (
                <span className={styles.activeIndicator}>
                  {tempFilters.moreFilters.yearBuiltMin && tempFilters.moreFilters.yearBuiltMin}
                  {tempFilters.moreFilters.yearBuiltMin && tempFilters.moreFilters.yearBuiltMax && ' - '}
                  {tempFilters.moreFilters.yearBuiltMax && tempFilters.moreFilters.yearBuiltMax}
                </span>
              )}
            </label>
            <div className={styles.rangeInputs}>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  placeholder="Min year"
                  value={tempFilters.moreFilters.yearBuiltMin}
                  onChange={(e) => handleMoreFiltersChange({
                    ...tempFilters.moreFilters,
                    yearBuiltMin: e.target.value
                  })}
                  className={styles.numberInput}
                />
              </div>
              <div className={styles.rangeDivider}>to</div>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  placeholder="Max year"
                  value={tempFilters.moreFilters.yearBuiltMax}
                  onChange={(e) => handleMoreFiltersChange({
                    ...tempFilters.moreFilters,
                    yearBuiltMax: e.target.value
                  })}
                  className={styles.numberInput}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button 
          className={styles.clearButton}
          onClick={clearAllFilters}
          title="Reset all filters"
        >
          🗑️ Clear All
        </button>
        <button 
          className={styles.applyButton}
          onClick={applyFilters}
          title="Apply current filters"
        >
          ✓ Apply Filters ({Object.values(tempFilters).filter(v => v && v !== '').length + (tempFilters.moreFilters.minArea || tempFilters.moreFilters.maxArea || tempFilters.moreFilters.yearBuiltMin || tempFilters.moreFilters.yearBuiltMax ? 1 : 0)})
        </button>
      </div>
    </>
  );

  return (
    <div className={`${styles.filtersContainer} ${inHeader ? styles.headerFilters : styles.popupFilters}`} onClick={handleClickOutside}>
      {/* Search Location Input - Only show in popup mode */}
      {!inHeader && (
        <div className={styles.searchSection}>
          <h4 className={styles.propertyTitle}>
            📍 Search Location
            {searchValue && (
              <span className={styles.activeIndicator}>{searchValue}</span>
            )}
          </h4>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Enter address, city, or neighborhood..."
              value={searchValue}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              🔍 Search
            </button>
          </form>
          {showBoundaryButton && (
            <button 
              className={styles.removeBoundaryButton}
              onClick={handleRemoveBoundary}
            >
              ✕ Remove Search Area
            </button>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        {/* Header for popup mode */}
        {!inHeader && (
          <h4 className={styles.propertyTitle}>Property Filters</h4>
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
