import React from 'react';
import styles from '../styles/Home.module.css';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Ubika - Leading real estate marketplace | Email: info@ubika.com</p>
      </div>
    </footer>
  );
};

export default Footer;
