import type { Db } from '../db/client.js';
import { prisma } from '../db/client.js';

/** Claims only seats that are still available; the affected count detects concurrent claims. */
export async function markSeatsBooked(tx: Db, venueId: string, seatIds: string[]) {
  return tx.seat.updateMany({
    where: { id: { in: seatIds }, venueId, status: 'AVAILABLE' },
    data: { status: 'BOOKED' },
  });
}

export async function findSeatsByIds(seatIds: string[], client: Db = prisma) {
  return client.seat.findMany({ where: { id: { in: seatIds } } });
}
