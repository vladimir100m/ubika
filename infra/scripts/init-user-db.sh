#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER admin WITH PASSWORD 'admin';
    CREATE DATABASE ubika;
    GRANT ALL PRIVILEGES ON DATABASE ubika TO admin;
EOSQL

# Connect to PostgreSQL and create the properties table
psql -U admin -d ubika <<EOF
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    zip_code TEXT,
    type TEXT NOT NULL,
    room INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    area INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL,
    yearbuilt INTEGER,
    geocode TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF