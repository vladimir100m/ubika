import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

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
      },
      instructions: `Use this ID to reassign properties: node scripts/reassign-properties.js user_602b1234567890abcdef1234 ${userId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
