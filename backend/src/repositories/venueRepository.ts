import type { Db } from '../db/client.js';
import { prisma } from '../db/client.js';

export async function listVenues(client: Db = prisma) {
  return client.venue.findMany({
    select: { id: true, name: true, rows: true, columns: true },
    orderBy: { name: 'asc' },
  });
}

export async function findVenueById(id: string, client: Db = prisma) {
  return client.venue.findUnique({ where: { id } });
}

export async function createVenue(data: { name: string; rows: number; columns: number }, client: Db = prisma) {
  return client.venue.create({ data });
}

export async function deleteVenue(id: string, client: Db = prisma) {
  return client.venue.delete({ where: { id } });
}

export async function listSeatsForVenue(venueId: string, client: Db = prisma) {
  return client.seat.findMany({ where: { venueId } });
}
