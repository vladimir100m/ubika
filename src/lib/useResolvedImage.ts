import { useEffect, useState } from 'react';

const cache = new Map<string, string | null>();

export default function useResolvedImage(imageUrl?: string | null) {
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) return imageUrl;
    // For blob:// we don't know until we resolve
    return cache.get(imageUrl) ?? null;
  });

  useEffect(() => {
    let mounted = true;
    if (!imageUrl || typeof imageUrl !== 'string') {
      setResolved(null);
      return;
    }

    if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('/')) {
      setResolved(imageUrl);
      cache.set(imageUrl, imageUrl);
      return;
    }

    // If cached, use it
    if (cache.has(imageUrl)) {
      setResolved(cache.get(imageUrl) ?? null);
      return;
    }

    // Resolve via server endpoint
    const resolve = async () => {
      try {
        const base = '';
        const resp = await fetch(`/api/blobs/resolve?key=${encodeURIComponent(imageUrl)}`);
        if (!mounted) return;
        if (!resp.ok) {
          cache.set(imageUrl, null);
          setResolved(null);
          return;
        }
        const data = await resp.json();
        const url = data?.url || null;
        cache.set(imageUrl, url);
        setResolved(url);
      } catch (err) {
        cache.set(imageUrl, null);
        if (mounted) setResolved(null);
      }
    };
    resolve();

    return () => { mounted = false; };
  }, [imageUrl]);

  return resolved;
}
