import React, { useState } from 'react';
import styles from '../styles/SearchBar.module.css';

interface SearchBarProps {
    onSearch?: (address: string, filters?: SearchFilters) => void;
}

export interface SearchFilters {
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    propertyType?: string;
}

declare global {
    interface Window {
        google: any;
    }
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [address, setAddress] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        propertyType: ''
    });

    React.useEffect(() => {
        if (window.google) {
            const input = document.getElementById('autocomplete-input') as HTMLInputElement;
            const autocomplete = new window.google.maps.places.Autocomplete(input);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.formatted_address) {
                    setAddress(place.formatted_address);
                }
            });
        }
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (onSearch) {
            onSearch(address, showAdvanced ? filters : undefined);
        } else {
            console.error('onSearch prop is not provided or is not a function');
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
    };

    return (
        <div className={styles.searchBarContainer}>
            <form className={styles.searchBar} onSubmit={handleSubmit}>
                <input
                    id="autocomplete-input"
                    type="text"
                    placeholder="Buscar dirección..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                    Buscar
                </button>
                <button 
                    type="button" 
                    className={styles.advancedButton} 
                    onClick={toggleAdvanced}
                    aria-expanded={showAdvanced}
                >
                    {showAdvanced ? 'Simple' : 'Advanced'}
                </button>
            </form>
            
            {showAdvanced && (
                <div className={styles.advancedFilters}>
                    <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="minPrice">Min Price</label>
                            <input
                                type="number"
                                id="minPrice"
                                name="minPrice"
                                placeholder="Min $"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className={styles.filterInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="maxPrice">Max Price</label>
                            <input
                                type="number"
                                id="maxPrice"
                                name="maxPrice"
                                placeholder="Max $"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className={styles.filterInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="bedrooms">Bedrooms</label>
                            <select
                                id="bedrooms"
                                name="bedrooms"
                                value={filters.bedrooms}
                                onChange={handleFilterChange}
                                className={styles.filterSelect}
                            >
                                <option value="">Any</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                                <option value="5">5+</option>
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="propertyType">Property Type</label>
                            <select
                                id="propertyType"
                                name="propertyType"
                                value={filters.propertyType}
                                onChange={handleFilterChange}
                                className={styles.filterSelect}
                            >
                                <option value="">Any</option>
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="land">Land</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;