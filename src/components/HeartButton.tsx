import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../styles/HeartButton.module.css';

interface HeartButtonProps {
  /** Whether the property is currently favorited */
  isFavorite: boolean;
  /** Callback when favorite status changes */
  onToggle: () => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Style variant */
  variant?: 'card' | 'popup' | 'floating';
  /** Show loading state */
  isLoading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  isFavorite,
  onToggle,
  size = 'medium',
  variant = 'card',
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    if (disabled || isLoading) return;

    // Trigger animations
    setIsAnimating(true);
    setShowPulse(true);

    // Call the onToggle function
    onToggle();

    // Reset animations
    setTimeout(() => {
      setIsAnimating(false);
      setShowPulse(false);
    }, 600);
  };

  // Size configurations
  const sizeConfig = {
    small: { width: 32, height: 32, iconSize: 16 },
    medium: { width: 40, height: 40, iconSize: 20 },
    large: { width: 48, height: 48, iconSize: 24 }
  };

  const config = sizeConfig[size];

  return (
    <button
      className={`
        ${styles.heartButton}
        ${styles[size]}
        ${styles[variant]}
        ${isFavorite ? styles.active : ''}
        ${isAnimating ? styles.animating : ''}
        ${showPulse ? styles.pulse : ''}
        ${disabled ? styles.disabled : ''}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      style={{
        width: config.width,
        height: config.height,
      }}
    >
      {/* Pulse effect */}
      {showPulse && <div className={styles.pulseRing} />}
      
      {/* Heart icon */}
      <div className={styles.iconContainer}>
        {isLoading ? (
          <div className={styles.spinner} />
        ) : (
          <svg
            width={config.iconSize}
            height={config.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            className={styles.heartIcon}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              className={styles.heartPath}
            />
          </svg>
        )}
      </div>

      {/* Success feedback */}
      {isFavorite && (
        <div className={styles.successIcon}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

export default HeartButton;
