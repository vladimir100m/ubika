/**
 * Property update event system for cross-component cache invalidation
 */

export interface PropertyUpdateEvent {
  type: 'PROPERTY_UPDATED' | 'PROPERTY_IMAGES_UPDATED' | 'PROPERTY_DELETED';
  propertyId: string | number;
  timestamp: number;
  metadata?: any;
}

/**
 * Emit a property update event to notify other components
 */
export function emitPropertyUpdate(event: PropertyUpdateEvent) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('propertyUpdate', { 
      detail: event 
    }));
    console.log('🔄 Property update event emitted:', event);
  }
}

/**
 * Listen for property update events
 */
export function usePropertyUpdateListener(
  callback: (event: PropertyUpdateEvent) => void
) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (event: CustomEvent<PropertyUpdateEvent>) => {
    callback(event.detail);
  };

  window.addEventListener('propertyUpdate', handleUpdate as EventListener);
  
  return () => {
    window.removeEventListener('propertyUpdate', handleUpdate as EventListener);
  };
}

/**
 * Emit image update event specifically
 */
export function emitImageUpdate(propertyId: string | number, imageCount: number) {
  emitPropertyUpdate({
    type: 'PROPERTY_IMAGES_UPDATED',
    propertyId,
    timestamp: Date.now(),
    metadata: { imageCount }
  });
}

export default {
  emitPropertyUpdate,
  usePropertyUpdateListener,
  emitImageUpdate
};