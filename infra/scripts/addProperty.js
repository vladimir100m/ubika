import { Client } from 'pg';

const addProperty = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  const property = {
    id: 15,
    title: 'Property at Scalabrini Ortiz al 1700',
    description: 'Villa de lujo con piscina y amplios jardines.',
    price: '$2,000,000',
    address: 'Scalabrini Ortiz al 1700, Palermo Soho, Palermo',
    city: 'Unknown city',
    state: 'Unknown state',
    country: 'Unknown country',
    zip_code: null,
    type: 'Unknown type',
    room: 6,
    bathrooms: 5,
    area: 500,
    image_url: '/properties/villa-lujo.jpg',
    status: 'available',
    created_at: new Date(),
    updated_at: new Date(),
    geocode: { lat: -34.5897318, lng: -58.4232065 },
  };

  try {
    await client.connect();

    const query = `
      INSERT INTO properties (
        id, title, description, price, address, city, state, country, zip_code, type, room, bathrooms, area, image_url, status, created_at, updated_at, geocode
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        zip_code = EXCLUDED.zip_code,
        type = EXCLUDED.type,
        room = EXCLUDED.room,
        bathrooms = EXCLUDED.bathrooms,
        area = EXCLUDED.area,
        image_url = EXCLUDED.image_url,
        status = EXCLUDED.status,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        geocode = EXCLUDED.geocode;
    `;

    const values = [
      property.id,
      property.title,
      property.description,
      property.price,
      property.address,
      property.city,
      property.state,
      property.country,
      property.zip_code,
      property.type,
      property.room,
      property.bathrooms,
      property.area,
      property.image_url,
      property.status,
      property.created_at,
      property.updated_at,
      property.geocode,
    ];

    await client.query(query, values);
    console.log('Property added/updated successfully');
  } catch (error) {
    console.error('Error adding property:', error);
  } finally {
    await client.end();
  }
};

addProperty();