'use client';

import React from 'react';
// Using a CSS background for the banner image to avoid forwarding image props
// (like fetchPriority) to a native <img> element which causes React warnings.
import styles from '../styles/Banner.module.css';
import SimpleSearchBar from './SimpleSearchBar';
import { useRouter } from 'next/navigation';

import { FilterOptions } from './MapFilters';

interface BannerProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const Banner: React.FC<BannerProps> = ({ onFilterChange }) => {
    const router = useRouter();

    const handleSearch = (address: string) => {
        // Save the search to localStorage for search history
        try {
            const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            const newSearch = {
                id: Date.now(),
                address,
                timestamp: new Date().toISOString()
            };
            
            // Add to the beginning of the array and limit to 10 searches
            const updatedHistory = [newSearch, ...searchHistory].slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }

        // Navigate to the map page with just the address
        router.push(`/map?address=${encodeURIComponent(address)}`);
    };

    return (
        <header
            className={styles.Banner_banner__biC5I}
            style={{
                backgroundImage: "url('/home_background.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className={styles.Banner_content__biC5I}>
                <h1>Encuentra tu nuevo hogar</h1>
                <SimpleSearchBar onSearch={handleSearch} />
            </div>
        </header>
    );
};

export default Banner;
