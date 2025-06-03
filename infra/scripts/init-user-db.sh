#!/bin/bash
set -e

echo "Creating database and user..."

# Create the database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Database is already created by POSTGRES_DB env var
    GRANT ALL PRIVILEGES ON DATABASE ubika TO admin;
EOSQL

echo "Database initialization completed."
