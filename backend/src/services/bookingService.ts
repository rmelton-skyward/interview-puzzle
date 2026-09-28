import { prisma } from '../db/client.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import { createBooking as createBookingRecord, findBookingById } from '../repositories/bookingRepository.js';
import { findSeatsByIds, markSeatsBooked } from '../repositories/seatRepository.js';
import { findVenueById } from '../repositories/venueRepository.js';

export interface CreateBookingParams {
  venueId: string;
  seatIds: string[];
}

/**
 * Creates a booking atomically, using a conditional seat update to reject concurrent claims.
 */
export async function createBooking(params: CreateBookingParams) {
  const { venueId, seatIds } = params;
  if (seatIds.length === 0) {
    throw new ValidationError('At least one seat id is required to create a booking');
  }
  if (new Set(seatIds).size !== seatIds.length) {
    throw new ValidationError('Seat ids must be unique');
  }

  return prisma.$transaction(async (tx) => {
    const venue = await findVenueById(venueId, tx);
    if (!venue) {
      throw new NotFoundError(`Venue ${venueId} not found`);
    }

    const seats = await findSeatsByIds(seatIds, tx);
    if (seats.length !== seatIds.length) {
      throw new NotFoundError('One or more requested seats do not exist');
    }
    if (seats.some((seat) => seat.venueId !== venueId)) {
      throw new ValidationError('All seats must belong to the specified venue');
    }
    const updatedSeats = await markSeatsBooked(tx, venueId, seatIds);
    if (updatedSeats.count !== seatIds.length) {
      throw new ConflictError('One or more requested seats are no longer available');
    }

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
