import React, { useState, useEffect, useRef, ReactNode } from 'react';
import styles from '../styles/MobileUtils.module.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  pullDownThreshold?: number;
  maxPullDownDistance?: number;
  refreshIndicatorHeight?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshIndicatorHeight = 60,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only enable pull to refresh when at the top of the page
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
      } else {
        startYRef.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current !== null) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startYRef.current;
        
        // Only allow pulling down
        if (distance > 0) {
          // Apply resistance to make the pull feel more natural
          const newDistance = Math.min(distance * 0.5, maxPullDownDistance);
          setPullDistance(newDistance);
          setIsPulling(true);
          
          // Prevent scrolling while pulling
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = async () => {
      if (isPulling) {
        if (pullDistance >= pullDownThreshold) {
          // Trigger refresh
          setIsRefreshing(true);
          setPullDistance(refreshIndicatorHeight);
          
          try {
            await onRefresh();
          } catch (error) {
            console.error('Refresh failed:', error);
          }
          
          // Reset after refresh completes
          setIsRefreshing(false);
        }
        
        // Reset pulling state
        setPullDistance(0);
        setIsPulling(false);
        startYRef.current = null;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', onTouchStart, { passive: false });
      container.addEventListener('touchmove', onTouchMove, { passive: false });
      container.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [isPulling, pullDistance, pullDownThreshold, maxPullDownDistance, refreshIndicatorHeight, onRefresh]);

  return (
    <div className={styles.pullToRefresh} ref={containerRef}>
      <div 
        className={`${styles.pullIndicator} ${(isPulling || isRefreshing) ? styles.visible : ''}`} 
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div className={styles.spinnerContainer}>
          {isRefreshing ? (
            <div className={styles.spinner}></div>
          ) : (
            <div style={{ opacity: Math.min(pullDistance / pullDownThreshold, 1) }}>
              ↓ Pull to refresh
            </div>
          )}
        </div>
      </div>
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;