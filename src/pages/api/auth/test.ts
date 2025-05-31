import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@auth0/nextjs-auth0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (session) {
      res.status(200).json({
        authenticated: true,
        user: session.user,
        message: 'Auth0 is working!'
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
