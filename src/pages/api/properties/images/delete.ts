import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { query } from '../../../../utils/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageId } = req.query;
    
    if (!imageId || typeof imageId !== 'string') {
      return res.status(400).json({ error: 'Image ID is required' });
    }

    const imageIdNum = parseInt(imageId, 10);
    if (isNaN(imageIdNum)) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    // Get image details before deletion
    const imageResult = await query(
      'SELECT * FROM property_images WHERE id = $1',
      [imageIdNum]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = imageResult.rows[0];
    const wascover = image.is_cover;
    const propertyId = image.property_id;

    // Delete from database
    await query(
      'DELETE FROM property_images WHERE id = $1',
      [imageIdNum]
    );

    // Delete physical file
    try {
      // If image_url points to a blob or external storage, attempt to delete via Blob API
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const imageUrl: string = image.image_url;

      // If stored with a custom blob scheme (blob://<id>) attempt API delete using id
      if (token && imageUrl && imageUrl.startsWith('blob://')) {
        const blobId = imageUrl.replace('blob://', '');
        try {
          const baseUrl = process.env.BLOB_BASE_URL || 'https://api.vercel.com';
          await fetch(`${baseUrl}/v1/blob/${encodeURIComponent(blobId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (err) {
          console.warn('Blob delete failed:', err);
        }
      } else if (token && imageUrl && /^https?:\/\//i.test(imageUrl)) {
        // If image_url is a full URL, attempt delete by calling the blob DELETE endpoint if possible
        try {
          const baseUrl = process.env.BLOB_BASE_URL || 'https://api.vercel.com';
          // Some blob services can accept a path-based delete; best-effort
          await fetch(`${baseUrl}/v1/blob`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: imageUrl }) as any
          });
        } catch (err) {
          console.warn('Blob delete by URL failed:', err);
        }
      } else {
        // Local file fallback (image.image_url expected to be a relative path like /uploads/...)
        const imagePath = path.join(process.cwd(), 'public', image.image_url);
        await fs.unlink(imagePath);
      }
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError);
      // Continue even if file deletion fails
    }

    // If we deleted a cover image, set another image as cover
    if (wascover) {
      const remainingImages = await query(
        'SELECT id FROM property_images WHERE property_id = $1 ORDER BY display_order ASC LIMIT 1',
        [propertyId]
      );

      if (remainingImages.rows.length > 0) {
        await query(
          'UPDATE property_images SET is_cover = true WHERE id = $1',
          [remainingImages.rows[0].id]
        );
      }
    }

    res.status(200).json({
      message: 'Image deleted successfully',
      deleted_id: imageIdNum
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export default handler;
