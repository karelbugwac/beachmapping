import { z } from 'zod';
import { fullNameSchema } from '@/lib/validation/fullName';

// Regular User Email + Password Login
export const userLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;

// Regular User Registration (with RA 10173 consent requirement)
export const userRegisterSchema = z.object({
  name: fullNameSchema,
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  agreeToPrivacyPolicy: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Privacy Policy and Terms of Use',
  }),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;

// Staff / Beach Owner / Admin Login (Strict 6-digit PIN)
export const staffLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  pin: z.string().regex(/^\d{6}$/, 'Staff PIN must be exactly 6 digits'),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

// Force Reset Password / PIN (on first login or recovery)
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
