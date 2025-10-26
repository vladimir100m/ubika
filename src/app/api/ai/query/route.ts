import { queryText } from 'lib/ai/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const q = typeof body === 'string' ? body : body.query;
    const filters = body.filters || {};
    if (!q) return new Response(JSON.stringify({ error: 'query required' }), { status: 400 });
    const results = await queryText(q, filters);
    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
}
