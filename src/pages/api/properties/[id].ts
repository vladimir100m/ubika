import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
import { resolveImageUrl } from '../../../utils/blob';
import { Property } from '../../../types';

const handler = async (req: NextApiRequest, res: NextApiResponse<Property | { error: string }>) => {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid property ID' });
  }

  try {
    // Fetch the property
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
  NULL as image_url,
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      WHERE p.id = $1
    `;

    const result = await query(propertyQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = result.rows[0];

    // Fetch images for the property
    try {
      const imagesResult = await query(
        'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
        [property.id]
      );
      const imgs = imagesResult.rows;
      for (const img of imgs) {
        try {
          img.image_url = await resolveImageUrl(img.image_url);
        } catch (e) {
          // leave original if resolution fails
        }
      }
      property.images = imgs;
    } catch (imageError) {
      console.warn(`Failed to fetch images for property ${property.id}:`, imageError);
      property.images = [];
    }

    res.status(200).json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
