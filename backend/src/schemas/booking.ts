import { z } from 'zod';

export const CreateBookingRequestSchema = z.object({
  venueId: z.string().min(1),
  seatIds: z.array(z.string().min(1)).min(1).refine((seatIds) => new Set(seatIds).size === seatIds.length, {
    message: 'Seat ids must be unique',
  }),
});
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
