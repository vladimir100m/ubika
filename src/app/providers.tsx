'use client';

import React, { createContext, useContext } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useLoadScript } from '@react-google-maps/api';

// Create context for Google Maps loading state
const GoogleMapsContext = createContext<{ isLoaded: boolean; loadError?: Error | null }>({
  isLoaded: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

// Google Maps provider component - loads the API once for the entire app
function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'] as any,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
  return (
    <SessionProvider session={session}>
      <GoogleMapsProvider>
        {children}
      </GoogleMapsProvider>
    </SessionProvider>
  );
}
