import { NextRequest } from 'next/server';
import { ingestBatch } from 'lib/ai/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = body.ids || body || [];

    // Simple admin secret check
    const adminSecret = process.env.AI_ADMIN_SECRET;
    const headerSecret = (req as any).headers?.get?.('x-ai-admin-secret');
    if (!adminSecret || headerSecret !== adminSecret) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    if (!Array.isArray(ids)) return new Response(JSON.stringify({ error: 'ids must be an array' }), { status: 400 });

    const results = await ingestBatch(ids);
    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
}
