import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createPropertyStatusRelation = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to Neon database');

    // Create the property_operation_statuses table with specific IDs
    const createPropertyOperationStatusesQuery = `
      CREATE TABLE IF NOT EXISTS property_operation_statuses (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createPropertyOperationStatusesQuery);
    console.log('✅ Created property_operation_statuses table');

    // Insert the specific statuses with the requested IDs
    const propertyOperationStatuses = [
      { id: 1, name: 'sale', display_name: 'Venta', description: 'Property is available for sale' },
      { id: 2, name: 'rent', display_name: 'Alquiler', description: 'Property is available for rent' },
      { id: 3, name: 'not_available', display_name: 'No Disponible', description: 'Property is not available' }
    ];

    const insertOperationStatusQuery = `
      INSERT INTO property_operation_statuses (id, name, display_name, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description;
    `;

    for (const status of propertyOperationStatuses) {
      await client.query(insertOperationStatusQuery, [status.id, status.name, status.display_name, status.description]);
      console.log(`✅ Inserted status: ${status.id} - ${status.display_name}`);
    }

    // Add operation_status_id column to properties table
    const addOperationStatusColumnQuery = `
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS operation_status_id INTEGER 
      REFERENCES property_operation_statuses(id) DEFAULT 1;
    `;
    await client.query(addOperationStatusColumnQuery);
    console.log('✅ Added operation_status_id column to properties table');

    // Create index for better performance
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_properties_operation_status 
      ON properties(operation_status_id);
    `;
    await client.query(createIndexQuery);
    console.log('✅ Created index on operation_status_id');

    // Update existing properties to have default operation status (Sale = 1)
    const updateExistingPropertiesQuery = `
      UPDATE properties 
      SET operation_status_id = 1 
      WHERE operation_status_id IS NULL;
    `;
    const updateResult = await client.query(updateExistingPropertiesQuery);
    console.log(`✅ Updated ${updateResult.rowCount} existing properties with default operation status`);

    console.log('\n🎉 Property status relationship created successfully!');
    console.log('Status IDs:');
    console.log('1 = Sale (Venta)');
    console.log('2 = Rent (Alquiler)');
    console.log('3 = Not Available (No Disponible)');

    // Display the created statuses
    const selectQuery = 'SELECT * FROM property_operation_statuses ORDER BY id';
    const result = await client.query(selectQuery);
    console.log('\nCreated statuses:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error creating property status relation:', error);
  } finally {
    await client.end();
  }
};

createPropertyStatusRelation().catch(console.error);
