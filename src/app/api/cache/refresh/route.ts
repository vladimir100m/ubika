import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { cacheInvalidatePattern } from '../../../../lib/cache';
import { createRequestId, createLogger } from '../../../../lib/logger';
import { CACHE_KEYS } from '../../../../lib/cacheKeyBuilder';

/**
 * Force refresh cache for user's properties
 * Called after property creation/update/deletion to ensure fresh data
 */
export async function POST(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('Cache refresh handler start');

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized cache refresh attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;
    const body = await req.json();
    const { scope = 'all' } = body; // 'user', 'all', or specific 'propertyId'

    log.info('Cache refresh requested', { userId, scope });

    try {
      // Clear user's specific property lists
      if (scope === 'user' || scope === 'all') {
        await cacheInvalidatePattern(CACHE_KEYS.seller(userId).listPattern());
        log.info('Cleared user property cache', { userId });
      }

      // Clear all property listings
      if (scope === 'all') {
        await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
        log.info('Cleared all properties cache');
      }

      // Clear specific property if provided
      if (body.propertyId) {
        const propertyKey = CACHE_KEYS.property(body.propertyId);
        // Note: cacheDel is removed, only use pattern invalidation
        // This is more reliable and single-call approach
        await cacheInvalidatePattern(`${propertyKey}*`);
        log.info('Cleared specific property cache', { propertyId: body.propertyId });
      }

      log.info('Cache refresh completed', { userId, scope });
      return NextResponse.json({ success: true, message: 'Cache refreshed' });
    } catch (e) {
      log.error('Error during cache refresh', { error: e });
      // Don't fail - cache refresh is informational
      return NextResponse.json({ success: false, message: 'Partial cache refresh' }, { status: 200 });
    }
  } catch (error) {
    log.error('Error in cache refresh handler', error);
    return NextResponse.json({ error: 'Failed to refresh cache' }, { status: 500 });
  }
}
