import React, { useState, useEffect } from 'react';
import styles from '../styles/SimpleSearchBar.module.css';

interface SimpleSearchBarProps {
    onSearch?: (address: string) => void;
    placeholder?: string;
}

declare global {
    interface Window {
        google: any;
    }
}

const SimpleSearchBar: React.FC<SimpleSearchBarProps> = ({ 
    onSearch, 
    placeholder = "Buscar dirección..."
}) => {
    const [address, setAddress] = useState('');

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (window.google) {
            const input = document.getElementById('simple-autocomplete-input') as HTMLInputElement;
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
        if (onSearch && address.trim()) {
            onSearch(address);
        }
    };

    return (
        <div className={styles.simpleSearchBarContainer}>
            <form className={styles.simpleSearchBar} onSubmit={handleSubmit}>
                <input
                    id="simple-autocomplete-input"
                    type="text"
                    placeholder={placeholder}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={styles.simpleSearchInput}
                />
                <button type="submit" className={styles.simpleSearchButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default SimpleSearchBar;
