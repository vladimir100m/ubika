import React from 'react';
import Link from 'next/link';
import styles from '../styles/Banner.module.css';
import SearchBar from './SearchBar';
import { useRouter } from 'next/router';

const Banner: React.FC = () => {
    const router = useRouter();

    const handleSearch = (address: string) => {
        router.push({
            pathname: '/map',
            query: { address },
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