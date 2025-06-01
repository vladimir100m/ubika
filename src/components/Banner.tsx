import React from 'react';
import styles from '../styles/Banner.module.css';
import SimpleSearchBar from './SimpleSearchBar';
import { useRouter } from 'next/router';

const Banner: React.FC = () => {
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
        router.push({
            pathname: '/map',
            query: { address }
        });
    };

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <h1>Encuentra tu nuevo hogar</h1>
                <SimpleSearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default Banner;
