import React, { useState, useEffect } from 'react';
import styles from '../styles/SearchBar.module.css';

interface SearchBarProps {
    onSearch?: (address: string, filters?: SearchFilters) => void;
}

export interface SearchFilters {
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    propertyType?: string;
    operation?: string;
    zone?: string;
    minArea?: string;
    maxArea?: string;
}

interface PropertyType {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface Neighborhood {
    id: number;
    name: string;
    city: string;
    country: string;
}

declare global {
    interface Window {
        google: any;
    }
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [address, setAddress] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        bathrooms: '',
        propertyType: '',
        zone: '',
        minArea: '',
        maxArea: ''
    });

    // Load property types and neighborhoods on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch property types
                const typesResponse = await fetch('/api/property-types');
                if (typesResponse.ok) {
                    const types = await typesResponse.json();
                    setPropertyTypes(types);
                }

                // Fetch neighborhoods
                const neighborhoodsResponse = await fetch('/api/neighborhoods');
                if (neighborhoodsResponse.ok) {
                    const neighborhoods = await neighborhoodsResponse.json();
                    setNeighborhoods(neighborhoods);
                }
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };

        fetchData();
    }, []);

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (window.google) {
            const input = document.getElementById('autocomplete-input') as HTMLInputElement;
            if (input) {
                const autocomplete = new window.google.maps.places.Autocomplete(input, {
                    componentRestrictions: { country: 'ar' }, // Restrict to Argentina
                    fields: ['formatted_address', 'geometry']
                });
                
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        setAddress(place.formatted_address);
                    }
                });
            }
        }
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (onSearch) {
            // Only pass filters that have values
            const activeFilters: SearchFilters = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    activeFilters[key as keyof SearchFilters] = value;
                }
            });
            
            onSearch(address, Object.keys(activeFilters).length > 0 ? activeFilters : undefined);
        } else {
            console.error('onSearch prop is not provided or is not a function');
        }
    };

    const handleFilterChange = (filterName: keyof SearchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            bathrooms: '',
            propertyType: '',
            zone: '',
            minArea: '',
            maxArea: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

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
                    className={`${styles.advancedButton} ${showAdvanced ? styles.active : ''}`}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    Filtros {hasActiveFilters && <span className={styles.filterIndicator}>●</span>}
                </button>
            </form>

            {showAdvanced && (
                <div className={styles.advancedFilters}>
                    <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                            <label>Tipo de Propiedad</label>
                            <select 
                                className={styles.filterSelect}
                                value={filters.propertyType || ''}
                                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                            >
                                <option value="">Cualquiera</option>
                                {propertyTypes.map(type => (
                                    <option key={type.id} value={type.name}>
                                        {type.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Zona</label>
                            <select 
                                className={styles.filterSelect}
                                value={filters.zone || ''}
                                onChange={(e) => handleFilterChange('zone', e.target.value)}
                            >
                                <option value="">Cualquiera</option>
                                {neighborhoods.map(neighborhood => (
                                    <option key={neighborhood.id} value={neighborhood.name}>
                                        {neighborhood.name}, {neighborhood.city}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                            <label>Precio Mínimo (USD)</label>
                            <input 
                                type="number"
                                className={styles.filterInput}
                                placeholder="0"
                                value={filters.minPrice || ''}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Precio Máximo (USD)</label>
                            <input 
                                type="number"
                                className={styles.filterInput}
                                placeholder="1000000"
                                value={filters.maxPrice || ''}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Dormitorios</label>
                            <select 
                                className={styles.filterSelect}
                                value={filters.bedrooms || ''}
                                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                            >
                                <option value="">Cualquiera</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                                <option value="5">5+</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Baños</label>
                            <select 
                                className={styles.filterSelect}
                                value={filters.bathrooms || ''}
                                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                            >
                                <option value="">Cualquiera</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                            <label>Superficie Mín. (m²)</label>
                            <input 
                                type="number"
                                className={styles.filterInput}
                                placeholder="0"
                                value={filters.minArea || ''}
                                onChange={(e) => handleFilterChange('minArea', e.target.value)}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Superficie Máx. (m²)</label>
                            <input 
                                type="number"
                                className={styles.filterInput}
                                placeholder="1000"
                                value={filters.maxArea || ''}
                                onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <div className={styles.filterActions}>
                                <button 
                                    type="button" 
                                    className={styles.clearButton}
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
