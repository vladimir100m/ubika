import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { PropertyCard } from '../components';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../types'; // Import Property and Geocode types

const MapPage: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [propertyLocations, setPropertyLocations] = useState<Property[]>([]); // Typed state
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (router.query.address) {
      setAddress(router.query.address as string);
    }

    // Fetch properties from the database
    const fetchProperties = async () => {
      try {
        const response = await axios.get<Property[]>('/api/properties'); // Expect Property[]
        if (Array.isArray(response.data)) {
          setPropertyLocations(response.data);
        } else {
          console.error('Error fetching properties: Data is not an array', response.data);
          setPropertyLocations([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setPropertyLocations([]);
      }
    };

    fetchProperties();
  }, [router.query]);

  useEffect(() => {
    if (propertyLocations.length > 0) {
      const firstProperty = propertyLocations[0];
      if (firstProperty.geocode) {
        setMapCenter(firstProperty.geocode);
      }
      const propertyMarkers = propertyLocations
        .filter((property) => property.geocode)
        .map((property) => ({ id: property.id, ...property.geocode! })); // Added non-null assertion for geocode
      setMarkers(propertyMarkers);
    }
  }, [propertyLocations]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });

    loader.load().then(() => {
      if (mapRef.current && !mapInstance.current) { // Ensure map is initialized only once
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 15,
        });
      }
    }).catch(e => {
      console.error("Error loading Google Maps API", e);
    });
    // Cleanup function to prevent issues with HMR or multiple initializations
    // return () => {
    //   if (mapInstance.current) {
    //     // Potentially unmount/destroy map instance if API supports it
    //   }
    // };
  }, []); // Removed mapCenter from dependencies to avoid re-creating map on center change

  useEffect(() => {
    if (mapInstance.current && markers.length > 0) {
      // Clear existing markers before adding new ones (optional, depends on desired behavior)
      // markersRef.current.forEach(marker => marker.setMap(null));
      // markersRef.current = []; 
      markers.forEach((marker) => {
        new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapInstance.current,
        });
        // Store marker instance if you need to clear them later
        // markersRef.current.push(gMarker);
      });
    }
  }, [markers, mapInstance.current]); // Added mapInstance.current to dependencies

  useEffect(() => {
    const currentAddress = router.query.address;

    if (currentAddress && typeof currentAddress === 'string' && mapInstance.current && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: currentAddress }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const geometry = results[0].geometry;
          const location = geometry.location;
          const bounds = geometry.viewport || geometry.bounds; // viewport is often preferred

          if (bounds && mapInstance.current) {
            // Polygon drawing logic (ensure it's what you need)
            // const polygonCoords = [
            //   { lat: bounds.getNorthEast().lat(), lng: bounds.getNorthEast().lng() },
            //   { lat: bounds.getSouthWest().lat(), lng: bounds.getNorthEast().lng() },
            //   { lat: bounds.getSouthWest().lat(), lng: bounds.getSouthWest().lng() },
            //   { lat: bounds.getNorthEast().lat(), lng: bounds.getSouthWest().lng() },
            // ];
            // new window.google.maps.Polygon({
            //   paths: polygonCoords,
            //   strokeColor: '#FF0000',
            //   strokeOpacity: 0.8,
            //   strokeWeight: 2,
            //   fillColor: '#FF0000',
            //   fillOpacity: 0.35,
            //   map: mapInstance.current,
            // });

            mapInstance.current.fitBounds(bounds);
            // Optionally, also set a marker at the geocoded location
            // new google.maps.Marker({
            //   position: location,
            //   map: mapInstance.current,
            //   title: currentAddress
            // });
          } else if (location && mapInstance.current) {
            mapInstance.current.setCenter(location);
            // Set a default zoom if bounds are not available
            mapInstance.current.setZoom(15); 
          }
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
        }
      });
    }
  }, [router.query.address, mapInstance.current]); // Added mapInstance.current to dependencies

  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <nav>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">Mortgage</a>
          <a href="#">Saved Homes</a>
        </nav>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', gap: '1rem' }}>
          <input type="text" placeholder="Location" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <input type="number" placeholder="Rooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="number" placeholder="Bathrooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="text" placeholder="Price range" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <button style={{ padding: '0.5rem 1rem', borderRadius: '5px', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.3s ease' }}>
            Apply
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <div style={{ flex: 1.5, height: '90vh', position: 'relative' }} className={styles.mapContainer} ref={mapRef}></div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className={styles.propertyGrid}>
              {propertyLocations.map((property) => (
                <PropertyCard
                  key={property.id}
                  image_url={property.image_url} // Corrected from imageUrl
                  description={property.description}
                  price={`$${property.price}`}
                  address={property.address}
                  rooms={property.rooms}
                  bathrooms={property.bathrooms}
                  squareMeters={property.squareMeters}
                  yearBuilt={property.yearBuilt} // Keep as is, PropertyCard will handle undefined
                  latitude={property.latitude ?? property.geocode?.lat}
                  longitude={property.longitude ?? property.geocode?.lng}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MapPage;