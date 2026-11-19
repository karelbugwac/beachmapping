import { z } from 'zod';
import { fullNameSchema } from '@/lib/validation/fullName';
import { validateBeachAddress } from '@/lib/validation/beachAddress';

export const ownerApplicationSchema = z.object({
  applicant_full_name: fullNameSchema,
  applicant_email: z.string().email('Please provide a valid email address for contact and account creation'),
  business_name: z.string().trim().min(2, 'Business / Resort name is required').max(160),
  beach_name: z.string().trim().min(2, 'Beach name is required').max(160),
  beach_location: z.string().transform((value, context) => {
    const result = validateBeachAddress(value);
    if (!result.ok) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
      return z.NEVER;
    }
    return result.value;
  }),
  contact_phone: z.string().trim().min(7, 'Please provide a valid contact number').max(30),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that you agree to the Terms of Use and Privacy Policy (RA 10173)',
  }),
});

export type OwnerApplicationInput = z.infer<typeof ownerApplicationSchema>;

export const dataSubjectRequestSchema = z.object({
  fullName: fullNameSchema,
  email: z.string().email('Please provide a valid email address'),
  requestType: z.enum(['access', 'correction', 'erasure', 'objection', 'other']),
  details: z.string().min(10, 'Please describe your request in detail (at least 10 characters)'),
  agreeConsent: z.boolean().refine((val) => val === true, {
    message: 'Consent to verify identity and process request is required',
  }),
});

export type DataSubjectRequestInput = z.infer<typeof dataSubjectRequestSchema>;
