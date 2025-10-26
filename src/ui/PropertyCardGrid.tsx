import React from 'react';
import { Property } from '../types';
import PropertyCard from './PropertyCard';
import styles from '../styles/Home.module.css';

interface PropertyCardGridProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  hideActions?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  showEditDelete?: boolean;
}

/**
 * PropertyCardGrid
 * 
 * Displays a responsive grid of PropertyCard components.
 * Automatically adjusts columns based on screen size:
 * - Phone: 1 column
 * - iPad: 2 columns
 * - iPad Pro: 3 columns
 * - Desktop: 4 columns
 */
const PropertyCardGrid: React.FC<PropertyCardGridProps> = ({
  properties,
  onPropertyClick,
  hideActions = false,
  onEdit,
  onDelete,
  showEditDelete = false
}) => {
  return (
    <div className={styles.propertyListGrid} style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px',
      width: '100%'
    }}>
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onPropertyClick?.(property)}
          hideActions={hideActions}
          onEdit={() => onEdit?.(property)}
          onDelete={() => onDelete?.(property)}
          showEditDelete={showEditDelete}
        />
      ))}
    </div>
  );
};

export default PropertyCardGrid;
