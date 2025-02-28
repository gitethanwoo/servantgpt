import { Resend } from 'resend';
import { render } from '@react-email/components';
import PasswordResetEmail from '../emails/password-reset';

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
    
    // Render the React Email template to HTML
    const html = await render(PasswordResetEmail({ resetUrl }));
    
    const { data, error } = await resend.emails.send({
      from: 'ServantGPT <reset@servantgpt.com>',
      to: email,
      subject: 'Reset your password',
      html,
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