import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { cacheDel, cacheInvalidatePattern } from '../../../../lib/cache';
import { createRequestId, createLogger } from '../../../../lib/logger';

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
        await cacheDel(`seller:${userId}:properties:list`);
        await cacheInvalidatePattern(`seller:${userId}:properties:list:*`);
        log.info('Cleared user property cache', { userId });
      }

      // Clear all property listings
      if (scope === 'all') {
        await cacheDel(`properties:list`);
        await cacheInvalidatePattern(`properties:list:*`);
        log.info('Cleared all properties cache');
      }

      // Clear specific property if provided
      if (body.propertyId) {
        await cacheDel(`property:${body.propertyId}`);
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
