import type { Db } from '../db/client.js';
import { prisma } from '../db/client.js';

export async function createBooking(
  tx: Db,
  params: { venueId: string; partySize: number; seatIds: string[] },
) {
  return tx.booking.create({
    data: {
      venueId: params.venueId,
      partySize: params.partySize,
      seats: {
        create: params.seatIds.map((seatId) => ({ seatId })),
      },
    },
    include: { seats: { include: { seat: true } } },
  });
}

export async function findBookingById(id: string, client: Db = prisma) {
  return client.booking.findUnique({
    where: { id },
    include: { seats: { include: { seat: true } } },
  });
}
