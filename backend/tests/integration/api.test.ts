import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

const app = createApp();
const request = supertest(app);

let venueId: string;

beforeAll(async () => {
  const venue = await prisma.venue.create({
    data: { name: 'API Test Venue', rows: 2, columns: 5 },
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

describe('GET /api/health', () => {
  it('reports a healthy, connected database', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/venues', () => {
  it('returns venue summaries through the venue service', async () => {
    const res = await request.get('/api/venues');
    expect(res.status).toBe(200);
    expect(res.body.map((venue: { id: string }) => venue.id)).toContain(venueId);
  });
});

describe('GET /api/venues/:id', () => {
  it('returns the venue layout and seats', async () => {
    const res = await request.get(`/api/venues/${venueId}`);
    expect(res.status).toBe(200);
    expect(res.body.layout).toEqual({ rows: 2, columns: 5 });
    expect(res.body.seats).toHaveLength(10);
  });

  it('returns 404 for an unknown venue', async () => {
    const res = await request.get('/api/venues/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/venues/:id/best-seats', () => {
  it('returns the best contiguous seats for a party size', async () => {
    const res = await request.post(`/api/venues/${venueId}/best-seats`).send({ partySize: 2 });
    expect(res.status).toBe(200);
    expect(res.body.row).toBe('a');
    expect(res.body.seats.map((s: { column: number }) => s.column)).toEqual([2, 3]);
  });

  it('returns 400 for an invalid party size', async () => {
    const res = await request.post(`/api/venues/${venueId}/best-seats`).send({ partySize: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when no contiguous block fits the party size', async () => {
    const res = await request.post(`/api/venues/${venueId}/best-seats`).send({ partySize: 100 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NO_SEATS_AVAILABLE');
  });
});

describe('venue management', () => {
  it('allows venue names up to 30 characters and rejects longer names', async () => {
    const maxLengthName = await request.post('/api/venues').send({ name: 'v'.repeat(30), rows: 1, columns: 1 });
    const tooLongName = await request.post('/api/venues').send({ name: 'v'.repeat(31), rows: 1, columns: 1 });

    expect(maxLengthName.status).toBe(201);
    await request.delete(`/api/venues/${maxLengthName.body.id as string}`);
    expect(tooLongName.status).toBe(400);
    expect(tooLongName.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects venue layouts above 50 rows or 1000 columns', async () => {
    const tooManyRows = await request.post('/api/venues').send({ name: 'Too Many Rows', rows: 51, columns: 1 });
    const tooManyColumns = await request.post('/api/venues').send({ name: 'Too Many Columns', rows: 1, columns: 1001 });

    expect(tooManyRows.status).toBe(400);
    expect(tooManyRows.body.error.code).toBe('VALIDATION_ERROR');
    expect(tooManyColumns.status).toBe(400);
    expect(tooManyColumns.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects venue names that already exist regardless of case', async () => {
    const duplicate = await request.post('/api/venues').send({ name: 'api test venue', rows: 2, columns: 3 });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
    expect(duplicate.body.error.message).toMatch(/venue with this name already exists/i);
  });

  it('creates a venue with seats and cascades its bookings when deleted', async () => {
    const created = await request.post('/api/venues').send({ name: 'Managed Venue', rows: 2, columns: 3 });
    expect(created.status).toBe(201);

    const createdVenueId = created.body.id as string;
    const status = await request.get(`/api/venues/${createdVenueId}`);
    expect(status.body.seats).toHaveLength(6);

    const best = await request.post(`/api/venues/${createdVenueId}/best-seats`).send({ partySize: 2 });
    const booking = await request.post('/api/bookings').send({
      venueId: createdVenueId,
      seatIds: best.body.seats.map((seat: { id: string }) => seat.id),
    });
    expect(booking.status).toBe(201);

    const deleted = await request.delete(`/api/venues/${createdVenueId}`);
    expect(deleted.status).toBe(204);
    expect(await prisma.venue.findUnique({ where: { id: createdVenueId } })).toBeNull();
    expect(await prisma.seat.count({ where: { venueId: createdVenueId } })).toBe(0);
    expect(await prisma.booking.count({ where: { venueId: createdVenueId } })).toBe(0);
    expect(await prisma.bookingSeat.count({ where: { booking: { venueId: createdVenueId } } })).toBe(0);
  });
});

describe('POST /api/bookings', () => {
  it('creates a booking for available seats', async () => {
    const best = await request.post(`/api/venues/${venueId}/best-seats`).send({ partySize: 2 });
    const seatIds = best.body.seats.map((s: { id: string }) => s.id);

    const res = await request.post('/api/bookings').send({ venueId, seatIds });
    expect(res.status).toBe(201);
    expect(res.body.partySize).toBe(2);
  });

  it('returns 409 when a seat is already booked', async () => {
    const status = await request.get(`/api/venues/${venueId}`);
    const bookedSeat = status.body.seats.find((s: { status: string }) => s.status === 'BOOKED');

    const res = await request.post('/api/bookings').send({ venueId, seatIds: [bookedSeat.id] });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 when seatIds contains duplicates', async () => {
    const availableSeat = await prisma.seat.findFirst({ where: { venueId, status: 'AVAILABLE' } });
    const res = await request.post('/api/bookings').send({
      venueId,
      seatIds: [availableSeat!.id, availableSeat!.id],
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows only one of two simultaneous requests to book the same seat', async () => {
    const availableSeat = await prisma.seat.findFirst({ where: { venueId, status: 'AVAILABLE' } });
    const payload = { venueId, seatIds: [availableSeat!.id] };
    const responses = await Promise.all([
      request.post('/api/bookings').send(payload),
      request.post('/api/bookings').send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409)?.body.error.code).toBe('CONFLICT');
    expect(await prisma.bookingSeat.count({ where: { seatId: availableSeat!.id } })).toBe(1);
  });

  it('returns 400 for an empty seatIds array', async () => {
    const res = await request.post('/api/bookings').send({ venueId, seatIds: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/bookings/:id', () => {
  it('returns 404 for an unknown booking', async () => {
    const res = await request.get('/api/bookings/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('returns a 404 JSON error', async () => {
    const res = await request.get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
