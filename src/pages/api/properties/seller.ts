import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
import { resolveImageUrl } from '../../../utils/blob';
import { Property } from '../../../types';

const handler = async (req: NextApiRequest, res: NextApiResponse<Property[] | { error: string }>) => {
  const { seller_id } = req.query;

  if (!seller_id) {
    return res.status(400).json({ error: 'Seller ID is required' });
  }

  try {

  const sellerQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
  p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
  -- Prefer property_images (blob-backed) over hardcoded sample images.
  -- Removing static sample images so frontend uses uploaded blob images when available.
  NULL as image_url,
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await query(sellerQuery, [seller_id]);
    console.log(`Found ${result.rows.length} properties for seller ${seller_id}`);
    
    const properties = result.rows;

    // Fetch images for each property
    for (const property of properties) {
      try {
        const imagesResult = await query(
          'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
          [property.id]
        );
        // Resolve blob keys (blob://...) to public URLs when possible
        const imgs = imagesResult.rows || [];
        for (const img of imgs) {
          try {
            const resolved = await resolveImageUrl(img.image_url);
            if (resolved) img.image_url = resolved;
          } catch (e) {
            // leave original image_url if resolution fails
          }
        }
        property.images = imgs;
        // Also attempt to resolve the main property.image_url (fallback/sample) to a usable URL
        try {
          const mainResolved = await resolveImageUrl(property.image_url);
          if (mainResolved) property.image_url = mainResolved;
        } catch (e) {
          // ignore
        }
      } catch (imageError) {
        console.warn(`Failed to fetch images for property ${property.id}:`, imageError);
        property.images = [];
      }
    }

    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching seller properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
