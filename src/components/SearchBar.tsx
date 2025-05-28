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
            onSearch(address);
        } else {
            console.error('onSearch prop is not provided or is not a function');
        }
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
            </form>
        </div>
    );
};

export default SearchBar;
