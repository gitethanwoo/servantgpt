import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Base URL for the application
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Sends a password reset email to the user
 */
export async function sendPasswordResetEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  console.log('Sending reset email to:', email);
  console.log('Reset URL:', resetUrl);
  console.log('Using Resend API key:', process.env.RESEND_API_KEY ? 'API key is set' : 'API key is missing');

  try {
    console.log('Attempting to send email via Resend');
    const { data, error } = await resend.emails.send({
      from: 'ServantGPT <no-reply@servantgpt.com>',
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; font-size: 24px;">Reset your password</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click the button below to create a new password.
            This link will expire in 1 hour.
          </p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Or copy and paste this URL into your browser: ${resetUrl}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Email sent successfully, data:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
} 