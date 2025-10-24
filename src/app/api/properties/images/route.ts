import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { createRequestId, createLogger } from '../../../../lib/logger';

export async function POST(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('Register property image handler start');

  try {
    const body = await req.json();
    const { property_id, image_url, is_cover, display_order } = body;

    if (!property_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id and image_url' },
        { status: 400 }
      );
    }

    // Insert image record in database
    const insertQuery = `
      INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, property_id, image_url, is_cover, display_order, created_at
    `;

    const result = await query(insertQuery, [
      property_id,
      image_url,
      is_cover || false,
      display_order || 0,
    ]);

    const image = result.rows[0];

    log.info('Property image registered', {
      id: image.id,
      property_id: image.property_id,
      is_cover: image.is_cover,
    });

    return NextResponse.json(image);
  } catch (error) {
    log.error('Error registering property image', { error });
    return NextResponse.json(
      { error: 'Failed to register image' },
      { status: 500 }
    );
  }
}
