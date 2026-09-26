import type { Db } from '../db/client.js';
import { prisma } from '../db/client.js';

/** Reads the given seats within a transaction so their status can be checked before booking. */
export async function lockSeatsForUpdate(tx: Db, seatIds: string[]) {
  return tx.seat.findMany({ where: { id: { in: seatIds } } });
}

export async function markSeatsBooked(tx: Db, seatIds: string[]) {
  return tx.seat.updateMany({
    where: { id: { in: seatIds } },
    data: { status: 'BOOKED' },
  });
}

export async function findSeatsByIds(seatIds: string[], client: Db = prisma) {
  return client.seat.findMany({ where: { id: { in: seatIds } } });
}
