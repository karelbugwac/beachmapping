import { z } from 'zod';

export const beachSchema = z.object({
  name: z.string().min(3, 'Beach name must be at least 3 characters'),
  description: z.string().min(20, 'Please provide a detailed description (at least 20 characters)'),
  location: z.string().min(5, 'Location is required (e.g. Barangay Binongkalan, Catmon, Cebu)'),
  latitude: z.coerce.number().min(4.0).max(21.0, 'Must be within Philippine coordinates'),
  longitude: z.coerce.number().min(116.0).max(127.0, 'Must be within Philippine coordinates'),
  cover_image: z.string().url('Cover image must be a valid URL').optional().or(z.literal('')),
  opening_hours: z.string().min(3, 'Opening hours are required'),
  entrance_fee: z.string().optional(),
  cottage_fee: z.string().optional(),
  rules: z.string().optional(),
  status: z.enum(['active', 'suspended']).default('active'),
  amenity_ids: z.array(z.string()).default([]),
  activity_ids: z.array(z.string()).default([]),
});

export type BeachInput = z.infer<typeof beachSchema>;

export const externalLinkSchema = z.object({
  label: z.string().min(2, 'Link label is required (e.g. Facebook, Booking Site)'),
  url: z.string().url('Please enter a valid website URL'),
});

export type ExternalLinkInput = z.infer<typeof externalLinkSchema>;
