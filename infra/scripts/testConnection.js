import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const runConnectionTest = async () => {
  console.log('🔄 Testing Neon database connection...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query test passed:', result.rows[0]);
    
    console.log('🎉 Database connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runConnectionTest();
