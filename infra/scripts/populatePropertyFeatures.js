import { Client } from 'pg';

const populatePropertyFeatures = async () => {
  const client = new Client({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'ubika',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all properties
    const propertiesResult = await client.query('SELECT id FROM properties');
    const properties = propertiesResult.rows;

    // Get all features
    const featuresResult = await client.query('SELECT id FROM property_features');
    const features = featuresResult.rows;

    console.log(`Found ${properties.length} properties and ${features.length} features`);

    // For each property, assign 3-5 random features
    for (const property of properties) {
      const numFeatures = Math.floor(Math.random() * 3) + 3; // 3-5 features
      const shuffledFeatures = [...features].sort(() => 0.5 - Math.random());
      const selectedFeatures = shuffledFeatures.slice(0, numFeatures);

      for (const feature of selectedFeatures) {
        try {
          await client.query(
            'INSERT INTO property_feature_assignments (property_id, feature_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [property.id, feature.id]
          );
        } catch (error) {
          // Ignore duplicate assignments
        }
      }

      console.log(`Assigned ${selectedFeatures.length} features to property ${property.id}`);
    }

    console.log('Successfully populated property features!');
  } catch (error) {
    console.error('Error populating property features:', error);
  } finally {
    await client.end();
  }
};

populatePropertyFeatures().catch(console.error);
