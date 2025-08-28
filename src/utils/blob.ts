// Utility helpers for best-effort interaction with Blob object storage
import { head, del } from '@vercel/blob';

export async function resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;

  // If it's already an absolute URL, return as-is
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  // If imageUrl uses our blob:// scheme, attempt to resolve using SDK head() or fallback REST
  if (imageUrl.startsWith('blob://')) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;
    const blobId = imageUrl.replace('blob://', '');
    try {
      // SDK head accepts either a full URL or pathname
      const info = await head(blobId, { token });
      if (info?.url) return info.url;
      if (info?.downloadUrl) return info.downloadUrl;
      if (info?.pathname) return info.pathname;
    } catch (err) {
      // Fallback to REST-style GET if SDK can't resolve (legacy)
      try {
        const baseUrl = process.env.BLOB_BASE_URL || 'https://api.vercel.com';
        const resp = await fetch(`${baseUrl}/v1/blob/${encodeURIComponent(blobId)}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return null;
        const data = await resp.json().catch(() => ({}));
        return data.url || data.publicUrl || data.cdnUrl || data.downloadUrl || null;
      } catch (e) {
        console.warn('resolveImageUrl fallback GET failed:', e);
        return null;
      }
    }
    return null;
  }

  // If it's a relative path (e.g., /uploads/...), prefix with base site URL if available
  if (imageUrl.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
    if (!base) return imageUrl; // return relative path
    return `${base.replace(/\/$/, '')}${imageUrl}`;
  }

  // Fallback: return original value
  return imageUrl;
}

export async function tryDeleteBlobByUrl(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  // If using blob:// scheme, pass pathname to del()
  if (imageUrl.startsWith('blob://')) {
    const blobId = imageUrl.replace('blob://', '');
    try {
      await del(blobId, { token });
      return;
    } catch (err) {
      console.warn('tryDeleteBlobByUrl SDK del failed, falling back to REST delete:', err);
      try {
        const baseUrl = process.env.BLOB_BASE_URL || 'https://api.vercel.com';
        await fetch(`${baseUrl}/v1/blob/${encodeURIComponent(blobId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('tryDeleteBlobByUrl fallback REST delete failed:', e);
      }
    }
  }

  // If imageUrl is a full URL we can call del() directly which accepts URLs too
  if (/^https?:\/\//i.test(imageUrl)) {
    try {
      await del(imageUrl, { token });
    } catch (err) {
      console.warn('tryDeleteBlobByUrl del by URL failed:', err);
    }
  }
}

export default { resolveImageUrl, tryDeleteBlobByUrl };
