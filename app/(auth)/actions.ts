'use server';

import { z } from 'zod';

import { 
  createUser, 
  getUser, 
  createPasswordResetToken, 
  getValidPasswordResetToken, 
  markPasswordResetTokenAsUsed, 
  updateUserPassword 
} from '@/lib/db/queries';
import { sendPasswordResetEmail } from '@/lib/email';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@servant.io'),
    {
      message: 'Only @servant.io email addresses are allowed',
    }
  ),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface ForgotPasswordActionState {
  status: 
    | 'idle' 
    | 'in_progress' 
    | 'success' 
    | 'failed' 
    | 'invalid_data'
    | 'user_not_found';
}

export const forgotPassword = async (
  _: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> => {
  try {
    const email = formData.get('email') as string;
    console.log('Processing forgot password request for:', email);
    
    // Validate email
    const emailSchema = z.string().email().refine(
      (email) => email.endsWith('@servant.io'),
      {
        message: 'Only @servant.io email addresses are allowed',
      }
    );
    
    emailSchema.parse(email);
    console.log('Email validation passed');
    
    // Check if user exists
    const users = await getUser(email);
    console.log('User lookup result:', users.length > 0 ? 'User found' : 'User not found');
    
    if (users.length === 0) {
      return { status: 'user_not_found' };
    }
    
    // Create password reset token
    const user = users[0];
    console.log('Creating password reset token for user ID:', user.id);
    const resetToken = await createPasswordResetToken(user.id);
    console.log('Password reset token created successfully');
    
    // Send password reset email
    console.log('Sending password reset email to:', user.email);
    await sendPasswordResetEmail({
      email: user.email,
      token: resetToken.token,
    });
    console.log('Password reset email sent successfully');
    
    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return { status: 'invalid_data' };
    }
    
    console.error('Failed to process forgot password request', error);
    return { status: 'failed' };
  }
};

export interface ResetPasswordActionState {
  status: 
    | 'idle' 
    | 'in_progress' 
    | 'success' 
    | 'failed' 
    | 'invalid_data'
    | 'invalid_token';
}

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> => {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    console.log('Processing password reset with token:', token ? 'Token provided' : 'No token');
    
    // Validate password
    const passwordSchema = z.object({
      password: z.string().min(6),
      confirmPassword: z.string(),
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
    
    passwordSchema.parse({ password, confirmPassword });
    console.log('Password validation passed');
    
    // Validate token
    const resetToken = await getValidPasswordResetToken(token);
    if (!resetToken) {
      console.log('Invalid or expired token');
      return { status: 'invalid_token' };
    }
    console.log('Valid token found for user ID:', resetToken.userId);
    
    // Update password
    await updateUserPassword(resetToken.userId, password);
    console.log('Password updated successfully');
    
    // Mark token as used
    await markPasswordResetTokenAsUsed(resetToken.id);
    console.log('Token marked as used');
    
    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return { status: 'invalid_data' };
    }
    
    console.error('Failed to reset password', error);
    return { status: 'failed' };
  }
};
