import React from 'react';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '', fullWidth = false }) => {
  return (
    <div className={`${styles.pageContainer} ${className}`}>
      <div className={fullWidth ? styles.fullWidthContent : styles.pageContent}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
