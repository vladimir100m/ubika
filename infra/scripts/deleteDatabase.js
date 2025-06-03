import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const deleteDatabase = async () => {
  // Note: For Neon database, you typically don't delete the entire database
  // Instead, you might want to truncate tables or delete specific data
  console.log('⚠️  Warning: This script was designed for local PostgreSQL.');
  console.log('For Neon database, consider using table truncation instead of database deletion.');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Instead of dropping the database, truncate all tables
    // This is more appropriate for managed databases like Neon
    const truncateQueries = [
      'TRUNCATE TABLE property_feature_assignments CASCADE;',
      'TRUNCATE TABLE property_features CASCADE;',
      'TRUNCATE TABLE property_types CASCADE;',
      'TRUNCATE TABLE property_statuses CASCADE;',
      'TRUNCATE TABLE neighborhoods CASCADE;',
      'TRUNCATE TABLE properties CASCADE;'
    ];

    for (const query of truncateQueries) {
      try {
        await client.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        // Table might not exist, that's okay
        console.log(`⚠️  Skipped: ${query} (table might not exist)`);
      }
    }

    console.log('🗑️  Database tables truncated successfully!');
  } catch (error) {
    console.error('Error truncating database tables:', error);
  } finally {
    await client.end();
  }
};

deleteDatabase();