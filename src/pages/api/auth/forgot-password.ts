import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
};

/**
 * API endpoint to handle password reset requests
 * 
 * In a real implementation, this would:
 * 1. Validate the email
 * 2. Check if the user exists
 * 3. Generate a secure random token
 * 4. Store the token with expiration time in the database
 * 5. Send an email with a reset link containing the token
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Simulate a delay for API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, we would:
    // 1. Check if the user exists
    // 2. Generate a secure token
    // 3. Save the token in the database with an expiration time
    // 4. Send an email with a link to reset-password page including the token

    // For security reasons, always return success even if the email doesn't exist
    // This prevents user enumeration attacks
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
}
