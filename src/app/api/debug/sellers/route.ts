import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

/**
 * DEBUG ENDPOINT: Check what seller_id values exist in database
 * This is a temporary endpoint to debug the seller filtering issue
 */
export async function GET(req: NextRequest) {
  try {
    // Get all unique seller_ids and their property counts
    const sellersResult = await query(`
      SELECT DISTINCT p.seller_id, COUNT(*) as property_count
      FROM properties p
      GROUP BY p.seller_id
      ORDER BY property_count DESC
      LIMIT 20
    `, []);

    // Get total properties count
    const totalResult = await query(`
      SELECT COUNT(*) as total_properties
      FROM properties p
    `, []);

    // Get sample properties with their seller_ids
    const samplesResult = await query(`
      SELECT id, title, seller_id, created_at
      FROM properties p
      ORDER BY created_at DESC
      LIMIT 5
    `, []);

    return NextResponse.json({
      debug: true,
      summary: {
        total_properties: totalResult.rows[0]?.total_properties || 0,
        unique_sellers: sellersResult.rows.length,
      },
      sellers_with_counts: sellersResult.rows,
      sample_properties: samplesResult.rows,
      instructions: 'Check the seller_ids above and match them with your logged-in email address'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
