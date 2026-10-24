import { z } from 'zod';

export const reviewSchema = z.object({
  beach_id: z.string().uuid('Invalid beach identifier'),
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  comment: z.string().min(5, 'Review comment must be at least 5 characters long'),
  photo_paths: z.array(z.string()).default([]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
