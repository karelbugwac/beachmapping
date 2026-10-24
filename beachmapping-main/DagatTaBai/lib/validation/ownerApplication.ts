import { z } from 'zod';

export const ownerApplicationSchema = z.object({
  applicant_full_name: z.string().trim().min(3, 'Full name is required (minimum 3 characters)').max(120),
  applicant_email: z.string().email('Please provide a valid email address for contact and account creation'),
  business_name: z.string().trim().min(2, 'Business / Resort name is required').max(160),
  beach_name: z.string().trim().min(2, 'Beach name is required').max(160),
  beach_location: z.string().trim().min(3, 'Beach location is required').max(240),
  contact_phone: z.string().trim().min(7, 'Please provide a valid contact number').max(30),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that you agree to the Terms of Use and Privacy Policy (RA 10173)',
  }),
});

export type OwnerApplicationInput = z.infer<typeof ownerApplicationSchema>;

export const dataSubjectRequestSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please provide a valid email address'),
  requestType: z.enum(['access', 'correction', 'erasure', 'objection', 'other']),
  details: z.string().min(10, 'Please describe your request in detail (at least 10 characters)'),
  agreeConsent: z.boolean().refine((val) => val === true, {
    message: 'Consent to verify identity and process request is required',
  }),
});

export type DataSubjectRequestInput = z.infer<typeof dataSubjectRequestSchema>;
