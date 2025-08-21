import React, { useState } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';
import PropertyGallery from './PropertyGallery';
import { useSession } from 'next-auth/react';
import { toggleSaveProperty } from '../utils/savedPropertiesApi';

export type PropertyCardProps = Pick<
  Property,
  | 'id'
  | 'image_url'
  | 'description'
  | 'price'
  | 'rooms'
  | 'bathrooms'
  | 'address'
  | 'squareMeters'
  | 'yearBuilt'
  | 'latitude'
  | 'longitude'
  | 'operation_status_id'
  | 'operation_status'
  | 'operation_status_display'
> & {
  title?: string;
  city?: string;
  state?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number, newStatus: boolean) => void;
  onClick?: () => void;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ isFavorite, onFavoriteToggle, onClick, ...p }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const defaultImage = '/images/property-placeholder.jpg';
  const images = [p.image_url].filter(Boolean) as string[];
  const formattedAddress = p.address ? (p.city && p.state ? `${p.address}, ${p.city}, ${p.state}` : p.address) : 'Address not available';

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { window.location.href = '/api/auth/login'; return; }
    if (saving) return;
    setSaving(true);
    try {
      const newStatus = !isFavorite;
      await toggleSaveProperty(p.id, isFavorite || false);
      onFavoriteToggle?.(p.id, newStatus);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className={styles.card} onClick={() => onClick ? onClick() : setOpen(true)}>
        <div className={styles.imageContainer}>
          <img src={p.image_url || defaultImage} alt={p.title || 'Property image'} className={styles.propertyImage} onError={(e: any) => e.currentTarget.src = defaultImage} />
          
          {/* Price overlay */}
          {p.price && (
            <div className={styles.priceOverlay}>
              <div className={styles.priceTag}>
                {p.price}
              </div>
            </div>
          )}
          
          {/* Favorite button */}
          <button onClick={handleSave} className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`} aria-label={isFavorite ? 'Remove favorite' : 'Save'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? '#ff4757' : 'none'} stroke={isFavorite ? '#ff4757' : '#666'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          {/* Property status badge */}
          <div className={styles.statusBadge}>
            {p.operation_status_display || (p.operation_status_id === 1 ? 'For Sale' : p.operation_status_id === 2 ? 'For Rent' : 'Not Available')}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.propertyHeader}>
            {p.title && <h3 className={styles.title}>{p.title}</h3>}
            <p className={styles.address}>{formattedAddress}</p>
          </div>
          
          <div className={styles.propertySpecs}>
            {p.rooms !== undefined && (
              <div className={styles.spec}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span>{p.rooms} bed{p.rooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {p.bathrooms !== undefined && (
              <div className={styles.spec}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M9 6a3 3 0 1 1 6 0"/>
                  <path d="M12 9v3"/>
                  <path d="M8 15h8"/>
                  <path d="M8 19h8"/>
                </svg>
                <span>{p.bathrooms} bath{p.bathrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {p.squareMeters !== undefined && (
              <div className={styles.spec}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M9 9h6v6H9z"/>
                </svg>
                <span>{p.squareMeters} m²</span>
              </div>
            )}
          </div>

          {p.description && (
            <p className={styles.description}>
              {p.description.length > 100 ? `${p.description.slice(0, 100)}...` : p.description}
            </p>
          )}

          <div className={styles.cardFooter}>
            <div className={styles.propertyActions}>
              <button className={styles.contactButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Contact
              </button>
              <a className={styles.viewButton} href={`/property/${p.id}`}>
                View Details
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className={styles.dialogOverlay} onClick={() => setOpen(false)} role="dialog">
          <div className={styles.zillowDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <h2 className={styles.dialogPrice}>{p.price}</h2>
                <h3 className={styles.dialogAddress}>{formattedAddress}</h3>
                <div className={styles.dialogQuickInfo}>
                  <span>{p.rooms} bd</span>
                  <span className={styles.bulletSeparator}>&bull;</span>
                  <span>{p.bathrooms} ba</span>
                  <span className={styles.bulletSeparator}>&bull;</span>
                  <span>{p.squareMeters} m²</span>
                </div>
              </div>
              <div className={styles.dialogActions}>
                <button onClick={handleSave} disabled={saving} className={styles.actionButton}>{saving ? 'Saving...' : (isFavorite ? 'Saved' : 'Save')}</button>
                <button className={styles.actionButton} onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share</button>
                <button onClick={() => setOpen(false)} className={styles.closeDialogButton}>&times;</button>
              </div>
            </div>

            <div className={styles.dialogContent}>
              <PropertyGallery images={images} initialIndex={0} />
              <div className={styles.overviewContentGrid}>
                <div className={styles.propertyMainDetails}>
                  <h3 className={styles.sectionTitle}>About This Home</h3>
                  <p className={styles.propertyDescription}>{p.description}</p>
                </div>
                <aside className={styles.propertyAsideDetails}>
                  <h3 className={styles.sectionTitle}>Contact</h3>
                  <button className={styles.contactButton}>Request a Tour</button>
                </aside>
              </div>
            </div>

            <div className={styles.dialogFooter}>
              <button onClick={() => setOpen(false)} className={styles.closeButton}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyCard;
