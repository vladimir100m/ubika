import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, {
      // Basic auth options for server session
      providers: [],
      callbacks: {
        session: ({ session, token }) => ({
          ...session,
          user: {
            ...session.user,
            sub: token.sub
          }
        })
      }
    });
    
    if (session) {
      res.status(200).json({
        authenticated: true,
        user: session.user,
        message: 'NextAuth is working!'
      });
    } else {
      res.status(200).json({
        authenticated: false,
        message: 'No active session'
      });
    }
  } catch (error) {
    console.error('Auth0 test error:', error);
    res.status(500).json({
      error: 'Auth0 test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
