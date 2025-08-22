import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
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
        CASE 
          WHEN p.type = 'house' THEN '/properties/casa-moderna.jpg'
          WHEN p.type = 'apartment' THEN '/properties/apartamento-moderno.jpg'
          WHEN p.type = 'cabin' THEN '/properties/cabana-bosque.jpg'
          WHEN p.type = 'villa' THEN '/properties/villa-lujo.jpg'
          WHEN p.type = 'penthouse' THEN '/properties/penthouse-lujo.jpg'
          WHEN p.type = 'loft' THEN '/properties/loft-urbano.jpg'
          WHEN p.type = 'duplex' THEN '/properties/duplex-moderno.jpg'
          ELSE '/properties/casa-moderna.jpg'
        END as image_url,
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
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching seller properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
