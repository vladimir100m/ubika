'use client';

import { useLoadScript } from '@react-google-maps/api';

/**
 * Custom hook to load Google Maps API with specified libraries
 * This hook ensures the API is loaded only once across the application
 * 
 * @param libraries - Optional array of Google Maps libraries to load ('places', 'geometry', etc)
 * @returns Object with isLoaded status
 */
export const useGoogleMapsLoader = (libraries?: string[]) => {
  const defaultLibraries = ['places'];
  const finalLibraries = libraries && libraries.length > 0 ? libraries : defaultLibraries;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: finalLibraries as any,
  });

  return { isLoaded, loadError };
};
