import React from 'react';
import styles from '../styles/Banner.module.css';
import SearchBar, { SearchFilters } from './SearchBar';
import { useRouter } from 'next/router';

const Banner: React.FC = () => {
    const router = useRouter();

    const handleSearch = (address: string, filters?: SearchFilters) => {
        // Save the search to localStorage for search history
        try {
            const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            const newSearch = {
                id: Date.now(),
                address,
                filters,
                timestamp: new Date().toISOString()
            };
            
            // Add to the beginning of the array and limit to 10 searches
            const updatedHistory = [newSearch, ...searchHistory].slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }

        // Navigate to the map page with search parameters
        const query: any = { address };
        
        if (filters) {
            if (filters.minPrice) query.minPrice = filters.minPrice;
            if (filters.maxPrice) query.maxPrice = filters.maxPrice;
            if (filters.bedrooms) query.bedrooms = filters.bedrooms;
            if (filters.bathrooms) query.bathrooms = filters.bathrooms;
            if (filters.propertyType) query.propertyType = filters.propertyType;
            if (filters.operation) query.operation = filters.operation;
            if (filters.zone) query.zone = filters.zone;
            if (filters.minArea) query.minArea = filters.minArea;
            if (filters.maxArea) query.maxArea = filters.maxArea;
        }
        
        router.push({
            pathname: '/map',
            query
        });
    };

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <h1>Encuentra tu nuevo hogar</h1>
                <SearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default Banner;
