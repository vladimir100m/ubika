import React, { useState, useEffect } from 'react';
import styles from '../styles/Mobile.module.css';
import utilStyles from '../styles/MobileUtils.module.css';

interface FloatingActionButtonProps {
  onFilterClick?: () => void;
  onSortClick?: () => void;
  onSaveSearchClick?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onFilterClick,
  onSortClick,
  onSaveSearchClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        if (isExpanded) {
          setIsExpanded(false);
          e.preventDefault(); // Prevent default behavior
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    setIsExpanded(false);
  };

  return (
    <div className={styles.fabContainer}>
      {isExpanded && (
        <div className={styles.fabOverlay} onClick={() => setIsExpanded(false)} />
      )}

      <div className={`${styles.fabOptions} ${isExpanded ? styles.expanded : ''}`}>
        {onFilterClick && (
          <button 
            className={`${styles.fabOption} ${utilStyles.touchFeedback}`}
            onClick={() => handleActionClick(onFilterClick)}
          >
            <span className={styles.fabIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
              </svg>
            </span>
            <span className={styles.fabLabel}>Filtrar</span>
          </button>
        )}
        
        {onSortClick && (
          <button 
            className={`${styles.fabOption} ${utilStyles.touchFeedback}`}
            onClick={() => handleActionClick(onSortClick)}
          >
            <span className={styles.fabIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="currentColor"/>
              </svg>
            </span>
            <span className={styles.fabLabel}>Ordenar</span>
          </button>
        )}
        
        {onSaveSearchClick && (
          <button 
            className={`${styles.fabOption} ${utilStyles.touchFeedback}`}
            onClick={() => handleActionClick(onSaveSearchClick)}
          >
            <span className={styles.fabIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" fill="currentColor"/>
              </svg>
            </span>
            <span className={styles.fabLabel}>Guardar búsqueda</span>
          </button>
        )}
      </div>

      <button 
        className={`${styles.fab} ${utilStyles.touchFeedback} ${isExpanded ? styles.active : ''}`}
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
