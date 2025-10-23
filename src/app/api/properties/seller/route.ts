import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { createRequestId, createLogger } from '../../../../lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { resolveImageUrl } from '../../../../lib/blob';

export async function GET(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('seller properties handler start', { method: req.method, url: req.url });

  try {
    const searchParams = req.nextUrl.searchParams;
    const sellerId = searchParams.get('seller_id');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'seller_id parameter is required' },
        { status: 400 }
      );
    }

    const queryText = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as bedrooms, p.bathrooms, p.square_meters as sq_meters,
        p.status, p.created_at, p.updated_at, p.year_built, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display,
        pt.id as property_type_id, pt.name as property_type_name, pt.display_name as property_type_display,
        ps.id as property_status_id, ps.name as property_status_name, ps.display_name as property_status_display, ps.color as property_status_color
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
  LEFT JOIN property_types pt ON pt.name = p.type
  LEFT JOIN property_statuses ps ON ps.name = p.status
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `;

    log.debug('executing query', { sellerId });
    const result = await query(queryText, [sellerId]);
    
    // Enrich rows with nested objects and images
    const rows = result.rows;
    for (const r of rows) {
      // attach property_type and property_status objects
      r.property_type = r.property_type_id ? {
        id: r.property_type_id,
        name: r.property_type_name,
        display_name: r.property_type_display
      } : null;

      r.property_status = r.property_status_id ? {
        id: r.property_status_id,
        name: r.property_status_name,
        display_name: r.property_status_display,
        color: r.property_status_color
      } : null;

      // Fetch images for property
      try {
        const imgs = await query(
          'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
          [r.id]
        );
        const images = imgs.rows || [];
        // resolve image URLs where possible
        for (const img of images) {
          try {
            img.image_url = await resolveImageUrl(img.image_url);
          } catch (e) {
            // leave original
          }
        }
        r.images = images;
      } catch (e) {
        r.images = [];
      }
    }

    log.info('seller properties query success', { count: rows.length });
    return NextResponse.json(rows);
  } catch (error) {
    log.error('Error fetching seller properties', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller properties' },
      { status: 500 }
    );
  }
}
