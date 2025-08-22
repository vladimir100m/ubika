import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../utils/db';

interface UpdateImageRequest {
  imageId: number;
  display_order?: number;
  is_cover?: boolean;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images } = req.body;
    
    if (!Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Begin transaction
    await query('BEGIN');

    try {
      for (const imageUpdate of images as UpdateImageRequest[]) {
        const { imageId, display_order, is_cover } = imageUpdate;

        if (!imageId) {
          continue;
        }

        // If setting as cover, first unset all other cover images for this property
        if (is_cover) {
          const propertyResult = await query(
            'SELECT property_id FROM property_images WHERE id = $1',
            [imageId]
          );

          if (propertyResult.rows.length > 0) {
            const propertyId = propertyResult.rows[0].property_id;
            await query(
              'UPDATE property_images SET is_cover = false WHERE property_id = $1',
              [propertyId]
            );
          }
        }

        // Update the image
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (display_order !== undefined) {
          updateFields.push(`display_order = $${paramIndex++}`);
          updateValues.push(display_order);
        }

        if (is_cover !== undefined) {
          updateFields.push(`is_cover = $${paramIndex++}`);
          updateValues.push(is_cover);
        }

        if (updateFields.length > 0) {
          updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
          updateValues.push(imageId);

          const updateQuery = `
            UPDATE property_images 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
          `;

          await query(updateQuery, updateValues);
        }
      }

      // Commit transaction
      await query('COMMIT');

      res.status(200).json({
        message: 'Images updated successfully',
        updated_count: images.length
      });

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating images:', error);
    res.status(500).json({ error: 'Failed to update images' });
  }
};

export default handler;
