import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/client.js';
import { ConflictError, NotFoundError } from '../../src/errors.js';
import { createBooking, getBooking } from '../../src/services/bookingService.js';
import { getBestSeats, getVenueStatus } from '../../src/services/venueService.js';

// Isolated 2x5 test venue, seeded/torn down per test file so it doesn't collide with dev seed data.
let venueId: string;

beforeAll(async () => {
  const venue = await prisma.venue.create({
    data: { name: 'Integration Test Venue', rows: 2, columns: 5 },
  });
  venueId = venue.id;

  const seats = [];
  for (const row of ['a', 'b']) {
    for (let column = 1; column <= 5; column++) {
      seats.push({ venueId, row, column });
    }
  }
  await prisma.seat.createMany({ data: seats });
});

afterAll(async () => {
  await prisma.bookingSeat.deleteMany({ where: { seat: { venueId } } });
  await prisma.booking.deleteMany({ where: { venueId } });
  await prisma.seat.deleteMany({ where: { venueId } });
  await prisma.venue.delete({ where: { id: venueId } });
  await prisma.$disconnect();
});

describe('venueService', () => {
  it('getVenueStatus returns venue layout and all seats', async () => {
    const status = await getVenueStatus(venueId);
    expect(status.layout).toEqual({ rows: 2, columns: 5 });
    expect(status.seats).toHaveLength(10);
  });

  it('getVenueStatus throws NotFoundError for an unknown venue', async () => {
    await expect(getVenueStatus('does-not-exist')).rejects.toThrow(NotFoundError);
  });

  it('getBestSeats returns the center-most seat for a party of 1', async () => {
    const result = await getBestSeats(venueId, 1);
    expect(result.row).toBe('a');
    expect(result.seats.map((s) => s.column)).toEqual([3]);
  });
});

describe('bookingService', () => {
  it('creates a booking and marks the seats BOOKED', async () => {
    const best = await getBestSeats(venueId, 2);
    const seatIds = best.seats.map((s) => s.id);

    const booking = await createBooking({ venueId, seatIds });
    expect(booking.partySize).toBe(2);
    expect(booking.seats).toHaveLength(2);

    const status = await getVenueStatus(venueId);
    const bookedSeats = status.seats.filter((s) => seatIds.includes(s.id));
    expect(bookedSeats.every((s) => s.status === 'BOOKED')).toBe(true);
  });

  it('rejects booking a seat that is already booked (race-condition guard)', async () => {
    const seats = await prisma.seat.findMany({ where: { venueId, row: 'a' }, orderBy: { column: 'asc' } });
    const alreadyBookedSeatId = seats.find((s) => s.status === 'BOOKED')!.id;

    await expect(
      createBooking({ venueId, seatIds: [alreadyBookedSeatId] }),
    ).rejects.toThrow(ConflictError);
  });

  it('getBooking returns the booking with its seats', async () => {
    const freeSeats = await prisma.seat.findMany({
      where: { venueId, row: 'b', status: 'AVAILABLE' },
      orderBy: { column: 'asc' },
      take: 1,
    });
    const booking = await createBooking({ venueId, seatIds: [freeSeats[0].id] });

    const fetched = await getBooking(booking.id);
    expect(fetched.id).toBe(booking.id);
    expect(fetched.seats[0].seat.id).toBe(freeSeats[0].id);
  });

  it('getBooking throws NotFoundError for an unknown booking id', async () => {
    await expect(getBooking('does-not-exist')).rejects.toThrow(NotFoundError);
  });
});
