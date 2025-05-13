#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER admin WITH PASSWORD 'admin';
    CREATE DATABASE ubika;
    GRANT ALL PRIVILEGES ON DATABASE ubika TO admin;
EOSQL