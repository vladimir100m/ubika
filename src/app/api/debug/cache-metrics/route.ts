import { NextRequest, NextResponse } from 'next/server';
import { cacheMetrics } from '../../../../lib/cacheMetrics';

/**
 * GET /api/debug/cache-metrics
 * Returns current cache performance metrics
 * Only accessible with proper auth in production
 */
export async function GET(req: NextRequest) {
  // In production, you may want to add authentication here
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const snapshot = cacheMetrics.getSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error fetching cache metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
