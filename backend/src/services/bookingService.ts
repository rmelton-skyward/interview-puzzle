import { prisma } from '../db/client.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import { createBooking as createBookingRecord, findBookingById } from '../repositories/bookingRepository.js';
import { lockSeatsForUpdate, markSeatsBooked } from '../repositories/seatRepository.js';
import { findVenueById } from '../repositories/venueRepository.js';

export interface CreateBookingParams {
  venueId: string;
  seatIds: string[];
}

/**
 * Creates a booking for the given seats inside a single transaction: re-reads seat status
 * to guard against a race with another booking, then marks seats BOOKED and inserts the
 * booking record atomically.
 */
export async function createBooking(params: CreateBookingParams) {
  const { venueId, seatIds } = params;
  if (seatIds.length === 0) {
    throw new ValidationError('At least one seat id is required to create a booking');
  }

  return prisma.$transaction(async (tx) => {
    const venue = await findVenueById(venueId, tx);
    if (!venue) {
      throw new NotFoundError(`Venue ${venueId} not found`);
    }

    const seats = await lockSeatsForUpdate(tx, seatIds);
    if (seats.length !== seatIds.length) {
      throw new NotFoundError('One or more requested seats do not exist');
    }
    if (seats.some((seat) => seat.venueId !== venueId)) {
      throw new ValidationError('All seats must belong to the specified venue');
    }
    if (seats.some((seat) => seat.status !== 'AVAILABLE')) {
      throw new ConflictError('One or more requested seats are no longer available');
    }

    await markSeatsBooked(tx, seatIds);
    return createBookingRecord(tx, { venueId, partySize: seatIds.length, seatIds });
  });
}

export async function getBooking(id: string) {
  const booking = await findBookingById(id);
  if (!booking) {
    throw new NotFoundError(`Booking ${id} not found`);
  }
  return booking;
}
