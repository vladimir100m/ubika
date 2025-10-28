#!/usr/bin/env node
/**
 * Feature Simulation Script
 * 
 * This script generates random features for all existing properties in the database.
 * It intelligently assigns features based on property type, bedrooms, and bathrooms.
 * 
 * Schema:
 * - property_features table: id, name, display_name, category, icon
 * - property_feature_assignments join table: property_id (UUID FK), feature_id (INT FK)
 * 
 * Usage: dotenv -e .env.local -- node scripts/simulate-features.js
 * 
 * Features are grouped by category:
 * - Interior: Air conditioning, heating, washer, dryer, dishwasher, etc.
 * - Outdoor: Balcony, patio, garden, parking, driveway, etc.
 * - Amenities: Pool, gym, elevator, security, etc.
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Feature definitions grouped by category
const FEATURE_CATALOG = {
  Interior: [
    { name: 'air_conditioning', display_name: 'Air Conditioning', icon: '❄️' },
    { name: 'heating', display_name: 'Heating', icon: '🔥' },
    { name: 'washer', display_name: 'Washer', icon: '🧺' },
    { name: 'dryer', display_name: 'Dryer', icon: '🌀' },
    { name: 'dishwasher', display_name: 'Dishwasher', icon: '🍽️' },
    { name: 'microwave', display_name: 'Microwave', icon: '🍳' },
    { name: 'fireplace', display_name: 'Fireplace', icon: '🔥' },
    { name: 'hardwood_floors', display_name: 'Hardwood Floors', icon: '🪵' },
    { name: 'carpet', display_name: 'Carpet', icon: '🟤' },
    { name: 'tile_floors', display_name: 'Tile Floors', icon: '⬜' },
    { name: 'walk_in_closet', display_name: 'Walk-in Closet', icon: '👔' },
    { name: 'granite_counters', display_name: 'Granite Counters', icon: '⚪' },
    { name: 'stainless_appliances', display_name: 'Stainless Steel Appliances', icon: '💎' },
  ],
  Outdoor: [
    { name: 'balcony', display_name: 'Balcony', icon: '🪟' },
    { name: 'patio', display_name: 'Patio', icon: '🪑' },
    { name: 'garden', display_name: 'Garden', icon: '🌳' },
    { name: 'parking', display_name: 'Parking', icon: '🅿️' },
    { name: 'driveway', display_name: 'Driveway', icon: '🛣️' },
    { name: 'deck', display_name: 'Deck', icon: '🌲' },
    { name: 'yard', display_name: 'Yard', icon: '🌿' },
    { name: 'bbq_grill', display_name: 'BBQ Grill', icon: '🔥' },
    { name: 'outdoor_kitchen', display_name: 'Outdoor Kitchen', icon: '👨‍🍳' },
    { name: 'carport', display_name: 'Carport', icon: '🚗' },
  ],
  Amenities: [
    { name: 'pool', display_name: 'Pool', icon: '🏊' },
    { name: 'gym', display_name: 'Gym/Fitness Center', icon: '💪' },
    { name: 'elevator', display_name: 'Elevator', icon: '⬆️' },
    { name: 'security_system', display_name: 'Security System', icon: '🔒' },
    { name: 'doorman', display_name: 'Doorman', icon: '🚪' },
    { name: 'concierge', display_name: 'Concierge', icon: '🎩' },
    { name: 'rooftop', display_name: 'Rooftop', icon: '🏢' },
    { name: 'spa', display_name: 'Spa/Hot Tub', icon: '♨️' },
    { name: 'sauna', display_name: 'Sauna', icon: '🧖' },
    { name: 'community_center', display_name: 'Community Center', icon: '🏘️' },
    { name: 'parking_garage', display_name: 'Parking Garage', icon: '🅿️' },
    { name: 'storage', display_name: 'Storage', icon: '📦' },
  ],
};

// Feature recommendations based on property characteristics
function getRecommendedFeatures(propertyType, bedrooms, bathrooms, sqMeters) {
  const features = [];
  
  // Base features common to all
  features.push({ category: 'Outdoor', name: 'parking' });
  features.push({ category: 'Interior', name: 'air_conditioning' });
  
  // Studio/Apartment specific
  if (propertyType.toLowerCase() === 'studio' || propertyType.toLowerCase() === 'apartment') {
    features.push({ category: 'Amenities', name: 'elevator' });
    features.push({ category: 'Amenities', name: 'security_system' });
    if (Math.random() > 0.4) features.push({ category: 'Outdoor', name: 'balcony' });
  }
  
  // House specific
  if (propertyType.toLowerCase() === 'house') {
    features.push({ category: 'Outdoor', name: 'driveway' });
    features.push({ category: 'Outdoor', name: 'yard' });
    if (Math.random() > 0.5) features.push({ category: 'Outdoor', name: 'patio' });
    if (Math.random() > 0.6) features.push({ category: 'Outdoor', name: 'deck' });
  }
  
  // Townhouse specific
  if (propertyType.toLowerCase() === 'townhouse') {
    features.push({ category: 'Outdoor', name: 'patio' });
    if (Math.random() > 0.4) features.push({ category: 'Outdoor', name: 'yard' });
  }
  
  // More bathrooms = more luxury features
  if (bathrooms >= 2) {
    features.push({ category: 'Interior', name: 'granite_counters' });
    if (Math.random() > 0.5) features.push({ category: 'Interior', name: 'walk_in_closet' });
  }
  
  // More bedrooms = likely larger property
  if (bedrooms >= 3) {
    features.push({ category: 'Interior', name: 'fireplace' });
    if (Math.random() > 0.4) features.push({ category: 'Outdoor', name: 'garden' });
  }
  
  // Larger square meters
  if (sqMeters > 150) {
    if (Math.random() > 0.5) features.push({ category: 'Amenities', name: 'spa' });
  }
  
  // Random features
  const categories = Object.keys(FEATURE_CATALOG);
  const numRandomFeatures = Math.floor(Math.random() * 3) + 1; // 1-3 random features
  
  for (let i = 0; i < numRandomFeatures; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomFeature = FEATURE_CATALOG[randomCategory][
      Math.floor(Math.random() * FEATURE_CATALOG[randomCategory].length)
    ];
    
    // Avoid duplicates
    if (!features.some(f => f.name === randomFeature.name)) {
      features.push({ category: randomCategory, name: randomFeature.name });
    }
  }
  
  return features;
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('\n================================================================================');
    console.log('PROPERTY FEATURES SIMULATION SCRIPT');
    console.log('================================================================================\n');
    
    await client.query('BEGIN');
    
    // Step 1: Insert all features into property_features table if not present
    console.log('📝 Step 1: Inserting feature catalog into property_features table...');
    let featuresInserted = 0;
    
    for (const [category, features] of Object.entries(FEATURE_CATALOG)) {
      for (const feature of features) {
        const result = await client.query(
          `INSERT INTO property_features (name, display_name, category, icon) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO NOTHING 
           RETURNING id`,
          [feature.name, feature.display_name, category, feature.icon]
        );
        if (result.rows.length > 0) {
          featuresInserted++;
        }
      }
    }
    console.log(`✓ Features ready (${featuresInserted} new features added)`);
    
    // Step 2: Get all existing properties
    console.log('\n📊 Step 2: Fetching all existing properties...');
    const propertiesResult = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.bedrooms,
        p.bathrooms,
        p.square_meters,
        pt.display_name as property_type,
        COUNT(pfa.id) as existing_features_count
      FROM properties p
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN property_feature_assignments pfa ON p.id = pfa.property_id
      GROUP BY p.id, p.title, p.bedrooms, p.bathrooms, p.square_meters, pt.display_name
      ORDER BY p.created_at
    `);
    
    const properties = propertiesResult.rows;
    console.log(`✓ Found ${properties.length} properties`);
    
    if (properties.length === 0) {
      console.log('⚠️  No properties found in database. Nothing to update.');
      await client.query('ROLLBACK');
      return;
    }
    
    // Step 3: Clear existing features for properties (optional - comment out to append instead)
    console.log('\n🔄 Step 3: Clearing existing feature assignments...');
    const deleteResult = await client.query(`
      DELETE FROM property_feature_assignments 
      WHERE property_id IN (SELECT id FROM properties)
    `);
    console.log(`✓ Removed ${deleteResult.rowCount} old feature assignments`);
    
    // Step 4: Generate and assign new features
    console.log('\n🎲 Step 4: Generating and assigning random features...');
    let totalAssignments = 0;
    
    for (const prop of properties) {
      // Get recommended features based on property characteristics
      const recommendedFeatures = getRecommendedFeatures(
        prop.property_type || 'house',
        prop.bedrooms || 0,
        prop.bathrooms || 0,
        prop.square_meters || 0
      );
      
      // Assign features
      for (const feature of recommendedFeatures) {
        const featureResult = await client.query(
          `SELECT id FROM property_features WHERE name = $1`,
          [feature.name]
        );
        
        if (featureResult.rows.length > 0) {
          const featureId = featureResult.rows[0].id;
          await client.query(
            `INSERT INTO property_feature_assignments (property_id, feature_id) 
             VALUES ($1, $2)`,
            [prop.id, featureId]
          );
          totalAssignments++;
        }
      }
      
      console.log(`  ✓ ${prop.title} (${prop.property_type}) - ${recommendedFeatures.length} features assigned`);
    }
    
    console.log(`\n✓ Total feature assignments created: ${totalAssignments}`);
    
    // Step 5: Summary statistics
    console.log('\n📈 Step 5: Summary Statistics');
    const statsResult = await client.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT pfa.property_id) as properties_with_features,
        COUNT(pfa.id) as total_feature_assignments,
        COUNT(DISTINCT pf.id) as total_unique_features
      FROM properties p
      LEFT JOIN property_feature_assignments pfa ON p.id = pfa.property_id
      LEFT JOIN property_features pf ON pfa.feature_id = pf.id
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  Total Properties: ${stats.total_properties}`);
    console.log(`  Properties with Features: ${stats.properties_with_features}`);
    console.log(`  Total Feature Assignments: ${stats.total_feature_assignments}`);
    console.log(`  Unique Features Used: ${stats.total_unique_features}`);
    
    // Step 6: Feature distribution by category
    console.log('\n📋 Step 6: Feature Distribution by Category');
    const categoryResult = await client.query(`
      SELECT 
        pf.category,
        COUNT(*) as count
      FROM property_feature_assignments pfa
      JOIN property_features pf ON pfa.feature_id = pf.id
      GROUP BY pf.category
      ORDER BY count DESC
    `);
    
    for (const row of categoryResult.rows) {
      console.log(`  ${row.category}: ${row.count} assignments`);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Feature simulation completed successfully!\n');
    
  } catch (err) {
    console.error('❌ Error during feature simulation:', err);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
