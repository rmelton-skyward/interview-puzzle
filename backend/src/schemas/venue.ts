import { z } from 'zod';

/**
 * Seat status values as used across the seat map.
 */
export const SeatStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'BOOKED']);
export type SeatStatus = z.infer<typeof SeatStatusSchema>;

/**
 * A single seat as described in the venue seat map.
 * `row` is a lowercase letter (or multi-letter, e.g. "aa") per spreadsheet-style row naming.
 */
export const SeatSchema = z.object({
  id: z.string().min(1),
  row: z
    .string()
    .min(1)
    .regex(/^[a-z]+$/, 'row must contain only lowercase letters'),
  column: z.number().int().positive(),
  status: SeatStatusSchema,
});
export type Seat = z.infer<typeof SeatSchema>;

export const VenueLayoutSchema = z.object({
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
});
export type VenueLayout = z.infer<typeof VenueLayoutSchema>;

export const VenueSchema = z.object({
  layout: VenueLayoutSchema,
});
export type Venue = z.infer<typeof VenueSchema>;

export const CreateVenueRequestSchema = z.object({
  name: z.string().trim().min(1).max(30),
  rows: z.number().int().positive().max(50),
  columns: z.number().int().positive().max(1000),
});
export type CreateVenueRequest = z.infer<typeof CreateVenueRequestSchema>;

export const SeatAssistantRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
});
export type SeatAssistantRequest = z.infer<typeof SeatAssistantRequestSchema>;

export const SeatAssistantPreferencesSchema = z.object({
  partySize: z.number().int().positive().max(100),
});
export type SeatAssistantPreferences = z.infer<typeof SeatAssistantPreferencesSchema>;

/**
 * Venue layout plus a map of seat IDs to seat records, consumed by the pure selector.
 */
export const VenueSeatMapSchema = z.object({
  venue: VenueSchema,
  seats: z.record(z.string(), SeatSchema),
});
export type VenueSeatMap = z.infer<typeof VenueSeatMapSchema>;

/**
 * Request body for the best-seats lookup.
 */
export const BestSeatsRequestSchema = z.object({
  partySize: z.number().int().positive(),
});
export type BestSeatsRequest = z.infer<typeof BestSeatsRequestSchema>;
