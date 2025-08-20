import React, { useState } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';
import PropertyGallery from './PropertyGallery';
import { useSession, signIn } from 'next-auth/react';
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
> & {
  title?: string;
  city?: string;
  state?: string;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  onClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number, newStatus: boolean) => void;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ isFavorite, onFavoriteToggle, ...p }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const defaultImage = '/images/property-placeholder.jpg';
  const images = [p.image_url].filter(Boolean) as string[];
  const formattedAddress = p.address ? (p.city && p.state ? `${p.address}, ${p.city}, ${p.state}` : p.address) : 'Address not available';

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { window.location.href = '/api/auth/signin'; return; }
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
      <div className={styles.card} onClick={() => setOpen(true)}>
        <div className={styles.imageContainer}>
          <img src={p.image_url || defaultImage} alt={p.title || 'Property image'} className={styles.propertyImage} onError={(e: any) => e.currentTarget.src = defaultImage} />
          {p.price && <div className={styles.priceTag}>{p.price}</div>}
          <button onClick={handleSave} className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`} aria-label={isFavorite ? 'Remove favorite' : 'Save'}>
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>

        <div className={styles.content}>
          {p.title && <h3 className={styles.title}>{p.title}</h3>}
          <p className={styles.address}>{formattedAddress}</p>
          <div className={styles.details}>
            {p.rooms !== undefined && <span>{p.rooms} bd</span>}
            {p.bathrooms !== undefined && <span> · {p.bathrooms} ba</span>}
            {p.squareMeters !== undefined && <span> · {p.squareMeters} m²</span>}
          </div>
          {p.description && <p className={styles.description}>{p.description.length > 120 ? `${p.description.slice(0, 120)}...` : p.description}</p>}
          <a className={styles.viewButton} href={`/property/${p.id}`}>View Details</a>
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
