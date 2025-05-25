import React, { useState } from 'react';
import styles from '../styles/Mobile.module.css';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  name: string;
  options: FilterOption[];
}

interface MobileFilterBarProps {
  filters: FilterGroup[];
  onFilterChange: (name: string, value: string) => void;
  activeFilters: Record<string, string>;
}

const MobileFilterBar: React.FC<MobileFilterBarProps> = ({ 
  filters, 
  onFilterChange, 
  activeFilters 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(filters[0]?.name || '');

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleFilterSelect = (name: string, value: string) => {
    onFilterChange(name, value);
  };

  const clearFilters = () => {
    filters.forEach(group => {
      onFilterChange(group.name, '');
    });
  };

  const applyFilters = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className={styles.mobileFilterBar}>
        <button 
          className={styles.filterButton} 
          onClick={toggleDrawer}
          aria-label="Open filters"
        >
          🔍 Filter
        </button>
        <div className={styles.activeFiltersContainer}>
          {Object.entries(activeFilters).map(([name, value]) => 
            value ? (
              <span key={name} className={styles.activeFilterPill}>
                {value}
                <button 
                  className={styles.clearFilterButton}
                  onClick={() => handleFilterSelect(name, '')}
                  aria-label={`Clear ${name} filter`}
                >
                  ✕
                </button>
              </span>
            ) : null
          )}
        </div>
      </div>

      <div className={`${styles.mobileDrawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerHandle} onClick={toggleDrawer}></div>
        
        <div className={styles.filterTabs}>
          {filters.map(group => (
            <button
              key={group.name}
              className={`${styles.filterTab} ${activeTab === group.name ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(group.name)}
            >
              {group.name}
            </button>
          ))}
        </div>
        
        <div className={styles.drawerContent}>
          {filters.map(group => (
            <div 
              key={group.name} 
              className={`${styles.filterGroup} ${activeTab === group.name ? styles.activeFilterGroup : ''}`}
            >
              {group.options.map(option => (
                <button
                  key={option.value}
                  className={`${styles.filterOption} ${activeFilters[group.name] === option.value ? styles.activeFilterOption : ''}`}
                  onClick={() => handleFilterSelect(group.name, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        
        <div className={styles.filterActions}>
          <button className={styles.clearFiltersButton} onClick={clearFilters}>
            Clear All
          </button>
          <button className={styles.applyFiltersButton} onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileFilterBar;