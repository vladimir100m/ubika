import { Client } from 'pg';
import fetch from 'node-fetch';

const GOOGLE_API_KEY = 'AIzaSyBkzFOZBpMj9aZfTajOgDeahFGNluRkopg'; // Replace with your actual Google API key

const loadGeocode = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    const res = await client.query('SELECT id, address FROM properties WHERE geocode IS NULL');
    const properties = res.rows;

    for (const property of properties) {
      const address = encodeURIComponent(property.address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const geocode = { lat: location.lat, lng: location.lng };

        await client.query(
          'UPDATE properties SET geocode = $1 WHERE id = $2',
          [geocode, property.id]
        );

        console.log(`Geocode for property ID ${property.id} updated:`, geocode);
      } else {
        console.error(`Failed to geocode address for property ID ${property.id}:`, data.status);
      }
    }

    console.log('Geocoding completed successfully!');
  } catch (error) {
    console.error('Error loading geocode:', error);
  } finally {
    await client.end();
  }
};

loadGeocode();