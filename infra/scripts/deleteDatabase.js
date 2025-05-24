import { Client } from 'pg';

const deleteDatabase = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'postgres', // Connect to the default database to execute the DROP DATABASE command
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    // Terminate all connections to the target database
    await client.query(`SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = 'ubika'
                          AND pid <> pg_backend_pid();`);

    // Drop the target database
    await client.query('DROP DATABASE IF EXISTS ubika;');

    console.log('Database "ubika" deleted successfully!');
  } catch (error) {
    console.error('Error deleting database:', error);
  } finally {
    await client.end();
  }
};

deleteDatabase();