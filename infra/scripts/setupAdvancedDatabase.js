import { Client } from 'pg';

const setupAdvancedDatabase = async () => {
  const client = new Client({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'ubika',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

    // Create property_features table
    const createFeaturesTableQuery = `
      CREATE TABLE IF NOT EXISTS property_features (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createFeaturesTableQuery);

    // Create property_feature_assignments table (many-to-many relationship)
    const createFeatureAssignmentsTableQuery = `
      CREATE TABLE IF NOT EXISTS property_feature_assignments (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        feature_id INTEGER REFERENCES property_features(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(property_id, feature_id)
      );
    `;
    await client.query(createFeatureAssignmentsTableQuery);

    // Create property_types table
    const createPropertyTypesTableQuery = `
      CREATE TABLE IF NOT EXISTS property_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createPropertyTypesTableQuery);

    // Create property_statuses table
    const createPropertyStatusesTableQuery = `
      CREATE TABLE IF NOT EXISTS property_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#000000',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createPropertyStatusesTableQuery);

    // Create neighborhoods table
    const createNeighborhoodsTableQuery = `
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        description TEXT,
        subway_access TEXT,
        dining_options TEXT,
        schools_info TEXT,
        shopping_info TEXT,
        parks_recreation TEXT,
        safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
        walkability_score INTEGER CHECK (walkability_score >= 0 AND walkability_score <= 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createNeighborhoodsTableQuery);

    // Insert default property features
    const features = [
      { name: 'Air Conditioning', category: 'climate', icon: 'snowflake' },
      { name: 'Heating', category: 'climate', icon: 'fire' },
      { name: 'Swimming Pool', category: 'recreation', icon: 'waves' },
      { name: 'Garden', category: 'outdoor', icon: 'tree' },
      { name: 'Balcony', category: 'outdoor', icon: 'home' },
      { name: 'Fireplace', category: 'interior', icon: 'fire' },
      { name: 'Hardwood Floor', category: 'flooring', icon: 'square' },
      { name: 'Tile Floor', category: 'flooring', icon: 'grid' },
      { name: 'Carpet', category: 'flooring', icon: 'square' },
      { name: 'Laminate Floor', category: 'flooring', icon: 'square' },
      { name: 'Granite Countertops', category: 'kitchen', icon: 'square' },
      { name: 'Stainless Steel Appliances', category: 'kitchen', icon: 'zap' },
      { name: 'Walk-in Closet', category: 'storage', icon: 'home' },
      { name: 'Laundry Room', category: 'utility', icon: 'home' },
      { name: 'Garage', category: 'parking', icon: 'car' },
      { name: 'Parking', category: 'parking', icon: 'car' },
      { name: 'Security System', category: 'security', icon: 'shield' },
      { name: 'Modern Kitchen', category: 'kitchen', icon: 'home' },
      { name: 'Central Air', category: 'climate', icon: 'wind' }
    ];

    const insertFeatureQuery = `
      INSERT INTO property_features (name, category, icon)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO NOTHING;
    `;

    for (const feature of features) {
      await client.query(insertFeatureQuery, [feature.name, feature.category, feature.icon]);
    }

    // Insert default property types
    const propertyTypes = [
      { name: 'casa', display_name: 'Casa', description: 'Single family house' },
      { name: 'apartamento', display_name: 'Apartamento', description: 'Apartment unit' },
      { name: 'duplex', display_name: 'Dúplex', description: 'Two-level apartment' },
      { name: 'loft', display_name: 'Loft', description: 'Open-plan living space' },
      { name: 'penthouse', display_name: 'Penthouse', description: 'Luxury top-floor apartment' },
      { name: 'villa', display_name: 'Villa', description: 'Luxury house' },
      { name: 'cabana', display_name: 'Cabaña', description: 'Cabin or cottage' },
      { name: 'terreno', display_name: 'Terreno', description: 'Land plot' },
      { name: 'oficina', display_name: 'Oficina', description: 'Office space' },
      { name: 'local_comercial', display_name: 'Local Comercial', description: 'Commercial space' }
    ];

    const insertPropertyTypeQuery = `
      INSERT INTO property_types (name, display_name, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO NOTHING;
    `;

    for (const type of propertyTypes) {
      await client.query(insertPropertyTypeQuery, [type.name, type.display_name, type.description]);
    }

    // Insert default property statuses
    const propertyStatuses = [
      { name: 'available', display_name: 'Disponible', description: 'Available for sale/rent', color: '#22c55e' },
      { name: 'sold', display_name: 'Vendido', description: 'Property has been sold', color: '#ef4444' },
      { name: 'rented', display_name: 'Alquilado', description: 'Property has been rented', color: '#f59e0b' },
      { name: 'pending', display_name: 'Pendiente', description: 'Sale/rental in progress', color: '#3b82f6' },
      { name: 'off_market', display_name: 'Fuera del Mercado', description: 'Temporarily off market', color: '#6b7280' }
    ];

    const insertPropertyStatusQuery = `
      INSERT INTO property_statuses (name, display_name, description, color)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO NOTHING;
    `;

    for (const status of propertyStatuses) {
      await client.query(insertPropertyStatusQuery, [status.name, status.display_name, status.description, status.color]);
    }

    // Insert sample neighborhoods for Buenos Aires
    const neighborhoods = [
      {
        name: 'Palermo',
        city: 'Buenos Aires',
        country: 'Argentina',
        description: 'Trendy neighborhood known for its parks, restaurants, and nightlife.',
        subway_access: '5 minute walk to nearest subway station',
        dining_options: 'Variety of dining options within walking distance',
        schools_info: 'Excellent schools in the area',
        shopping_info: 'Shopping centers and boutiques nearby',
        parks_recreation: 'Close to parks and recreational areas',
        safety_rating: 4,
        walkability_score: 85
      },
      {
        name: 'Recoleta',
        city: 'Buenos Aires',
        country: 'Argentina',
        description: 'Upscale neighborhood with museums, cafes, and historic architecture.',
        subway_access: '3 minute walk to nearest subway station',
        dining_options: 'Fine dining and traditional cafes',
        schools_info: 'Top-rated educational institutions',
        shopping_info: 'Luxury shopping and local markets',
        parks_recreation: 'Beautiful plazas and green spaces',
        safety_rating: 5,
        walkability_score: 90
      },
      {
        name: 'San Telmo',
        city: 'Buenos Aires',
        country: 'Argentina',
        description: 'Historic neighborhood famous for tango, antiques, and colonial architecture.',
        subway_access: '8 minute walk to nearest subway station',
        dining_options: 'Traditional restaurants and local eateries',
        schools_info: 'Good schools in the vicinity',
        shopping_info: 'Antique shops and weekend markets',
        parks_recreation: 'Historic plazas and cultural centers',
        safety_rating: 3,
        walkability_score: 75
      }
    ];

    const insertNeighborhoodQuery = `
      INSERT INTO neighborhoods (name, city, country, description, subway_access, dining_options, schools_info, shopping_info, parks_recreation, safety_rating, walkability_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING;
    `;

    for (const neighborhood of neighborhoods) {
      await client.query(insertNeighborhoodQuery, [
        neighborhood.name,
        neighborhood.city,
        neighborhood.country,
        neighborhood.description,
        neighborhood.subway_access,
        neighborhood.dining_options,
        neighborhood.schools_info,
        neighborhood.shopping_info,
        neighborhood.parks_recreation,
        neighborhood.safety_rating,
        neighborhood.walkability_score
      ]);
    }

    console.log('Advanced database setup completed successfully.');
    console.log('Created tables: property_features, property_feature_assignments, property_types, property_statuses, neighborhoods');
    console.log('Inserted default data for features, types, statuses, and neighborhoods.');

  } catch (error) {
    console.error('Error setting up advanced database:', error);
  } finally {
    await client.end();
  }
};

export default setupAdvancedDatabase;

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdvancedDatabase();
}
