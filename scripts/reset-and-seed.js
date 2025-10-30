#!/usr/bin/env node
/**
 * Destructive reset + seed script for local testing.
 * - Drops tables used by the app (safe for local/mock DB only)
 * - Creates proposed schema (lookup tables, properties, images, listings_history, etc.)
 * - Inserts a seller user id and 10 mock properties for seller_id '100296339400742202825'
 *
 * Usage: dotenv -e .env.local -- node scripts/reset-and-seed.js
 *
 * WARNING: This script drops tables. Only run in local/staging/mock DBs.
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SELLER_ID = '100296339400742202825';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("Connected to DB. Starting destructive reset...");
    await client.query('BEGIN');

    // Drop tables if they exist (in dependency order)
    const dropStmts = [
      `DROP TABLE IF EXISTS listings_history CASCADE`,
      `DROP TABLE IF EXISTS property_feature_assignments CASCADE`,
      `DROP TABLE IF EXISTS property_images CASCADE`,
      `DROP TABLE IF EXISTS property_media CASCADE`,
      `DROP TABLE IF EXISTS property_features CASCADE`,
      `DROP TABLE IF EXISTS property_types CASCADE`,
      `DROP TABLE IF EXISTS property_statuses CASCADE`,
      `DROP TABLE IF EXISTS property_operation_statuses CASCADE`,
      `DROP TABLE IF EXISTS user_saved_properties CASCADE`,
      `DROP TABLE IF EXISTS neighborhoods CASCADE`,
      `DROP TABLE IF EXISTS media_types CASCADE`,
      `DROP TABLE IF EXISTS properties CASCADE`
    ];

    for (const s of dropStmts) {
      console.log('DROP:', s);
      await client.query(s);
    }

    // Create lookup tables
    console.log('Creating lookup tables...');
    await client.query(`
      CREATE TABLE property_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE property_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200),
        color VARCHAR(20) DEFAULT '#000000',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE property_operation_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE property_features (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200),
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE neighborhoods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        description TEXT,
        subway_access TEXT,
        dining_options TEXT,
        schools_info TEXT,
        shopping_info TEXT,
        parks_recreation TEXT,
        safety_rating INTEGER,
        walkability_score INTEGER,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // properties table (UUID PK)
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);

    await client.query(`
      CREATE TABLE properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        price NUMERIC(14,2) NOT NULL DEFAULT 0,
        currency CHAR(3) DEFAULT 'USD',
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        zip_code TEXT,
        property_type_id INTEGER,
        property_status_id INTEGER,
        operation_status_id INTEGER,
        bedrooms INTEGER DEFAULT 0,
        bathrooms INTEGER DEFAULT 0,
        square_meters INTEGER DEFAULT 1,
        year_built INTEGER,
        seller_id VARCHAR(255) NOT NULL,
        geocode JSONB,
        latitude NUMERIC,
        longitude NUMERIC,
        published_at TIMESTAMPTZ,
        is_listed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // images and media
    await client.query(`
      CREATE TABLE property_images (
        id SERIAL PRIMARY KEY,
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        image_url VARCHAR(1000) NOT NULL,
        storage_key VARCHAR(1000),
        checksum VARCHAR(128),
        width INTEGER,
        height INTEGER,
        is_cover BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        mime_type VARCHAR(100),
        file_size INTEGER,
        original_filename VARCHAR(255),
        alt_text TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE property_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        media_type VARCHAR(50),
        url TEXT NOT NULL,
        storage_key TEXT,
        file_name TEXT,
        file_size INTEGER,
        mime_type TEXT,
        is_primary BOOLEAN DEFAULT false,
        uploaded_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // join table
    await client.query(`
      CREATE TABLE property_feature_assignments (
        id SERIAL PRIMARY KEY,
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        feature_id INTEGER REFERENCES property_features(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // user saved
    await client.query(`
      CREATE TABLE user_saved_properties (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        property_id UUID REFERENCES properties(id),
        saved_at TIMESTAMPTZ DEFAULT now(),
        is_favorite BOOLEAN DEFAULT false,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // listings history
    await client.query(`
      CREATE TABLE listings_history (
        id BIGSERIAL PRIMARY KEY,
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        previous_price NUMERIC(14,2),
        new_price NUMERIC(14,2),
        previous_status INTEGER,
        new_status INTEGER,
        changed_by VARCHAR(255),
        changed_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // media types
    await client.query(`
      CREATE TABLE media_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        allowed_extensions TEXT[]
      )
    `);

    // Insert some default lookup values
    console.log('Seeding lookup tables...');
    const propertyTypes = ['apartment', 'house', 'studio', 'townhouse', 'loft'];
    for (const t of propertyTypes) {
      await client.query(`INSERT INTO property_types (name, display_name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [t, t.charAt(0).toUpperCase() + t.slice(1)]);
    }

    const propertyStatuses = ['available', 'under_offer', 'sold'];
    for (const s of propertyStatuses) {
      await client.query(`INSERT INTO property_statuses (name, display_name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [s, s.replace('_', ' ').toUpperCase()]);
    }

    const operationStatuses = ['draft', 'published', 'archived'];
    for (const s of operationStatuses) {
      await client.query(`INSERT INTO property_operation_statuses (name, display_name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [s, s.charAt(0).toUpperCase() + s.slice(1)]);
    }

    // Add a few features
    const features = ['parking', 'balcony', 'pool', 'gym', 'air_conditioning'];
    for (const f of features) {
      await client.query(`INSERT INTO property_features (name, category, display_name) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`, [f, 'amenity', f.replace('_', ' ')]);
    }

    // Create 10 mock properties for the seller
    console.log('Creating 10 mock properties...');
    const insertedProperties = [];
    for (let i = 1; i <= 10; i++) {
      const title = `Mock Property #${i}`;
      const description = `This is a mock property number ${i} for testing.`;
      const price = (randomInt(50, 500) * 1000).toFixed(2);
      const city = ['New York', 'San Francisco', 'Austin', 'Miami', 'Chicago'][randomInt(0,4)];
      const typeRow = await client.query('SELECT id FROM property_types ORDER BY random() LIMIT 1');
      const statusRow = await client.query('SELECT id FROM property_statuses ORDER BY random() LIMIT 1');
      const operationRow = await client.query('SELECT id FROM property_operation_statuses ORDER BY random() LIMIT 1');
      const latitude = (40 + Math.random()).toFixed(6);
      const longitude = (-73 + Math.random()).toFixed(6);

      const res = await client.query(`
        INSERT INTO properties (title, description, price, currency, city, property_type_id, property_status_id, operation_status_id, bedrooms, bathrooms, square_meters, seller_id, latitude, longitude, is_listed)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING id
      `, [title, description, price, 'USD', city, typeRow.rows[0].id, statusRow.rows[0].id, operationRow.rows[0].id, randomInt(1,5), randomInt(1,3), randomInt(30,200), SELLER_ID, latitude, longitude, true]);

      const propertyId = res.rows[0].id;
      insertedProperties.push(propertyId);

      // Add one image
      await client.query(`
        INSERT INTO property_images (property_id, image_url, storage_key, is_cover, display_order, mime_type, file_size, original_filename)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [propertyId, `https://placehold.co/800x600?text=Property+${i}`, `images/property_${propertyId}_1.jpg`, true, 0, 'image/jpeg', randomInt(10000,500000), `property_${i}.jpg`]);

      // Assign some features
      const featureRows = await client.query('SELECT id FROM property_features ORDER BY random() LIMIT 2');
      for (const fr of featureRows.rows) {
        await client.query('INSERT INTO property_feature_assignments (property_id, feature_id) VALUES ($1, $2)', [propertyId, fr.id]);
      }

      // Insert into listings_history as initial
      await client.query(`INSERT INTO listings_history (property_id, previous_price, new_price, previous_status, new_status, changed_by) VALUES ($1, $2, $3, $4, $5, $6)`, [propertyId, null, price, null, statusRow.rows[0].id, SELLER_ID]);

      console.log('Created property', propertyId);
    }

    await client.query('COMMIT');
    console.log('Reset and seed successful. Inserted properties:', insertedProperties.length);
    console.log(insertedProperties.join('\n'));

  } catch (err) {
    console.error('Error during reset-and-seed:', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
