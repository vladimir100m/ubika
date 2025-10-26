import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated', auth: false },
        { status: 401 }
      );
    }

    const userId = (session.user as any)?.sub || session.user?.email;
    const userName = session.user?.name;
    const userEmail = session.user?.email;

    return NextResponse.json({
      auth: true,
      message: 'Your current user ID for seller view:',
      user: {
        name: userName,
        email: userEmail,
        id: userId,
        sub: (session.user as any)?.sub, // Show both for debugging
      },
      debug: {
        hasSubId: !!(session.user as any)?.sub,
        usingEmail: !!(session.user as any)?.sub === false,
      },
      instructions: `Use this ID to reassign properties: node scripts/reassign-properties.js test-seller-001 ${userId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
