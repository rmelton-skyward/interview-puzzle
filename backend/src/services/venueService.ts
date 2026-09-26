import { findBestSeats, type BestSeatsResult } from '../algorithm/seatSelector.js';
import { prisma } from '../db/client.js';
import { NoAvailableSeatsError, NotFoundError } from '../errors.js';
import { createVenue as createVenueRecord, deleteVenue as deleteVenueRecord, findVenueById, listSeatsForVenue } from '../repositories/venueRepository.js';
import type { CreateVenueRequest, Seat as AlgorithmSeat, VenueSeatMap } from '../schemas/venue.js';

interface DbSeat {
  id: string;
  row: string;
  column: number;
  status: string;
}

function toAlgorithmSeat(seat: DbSeat): AlgorithmSeat {
  return {
    id: seat.id,
    row: seat.row,
    column: seat.column,
    status: seat.status as AlgorithmSeat['status'],
  };
}

function indexToRow(index: number): string {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(97 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

export async function createVenue(params: CreateVenueRequest) {
  return prisma.$transaction(async (tx) => {
    const venue = await createVenueRecord(params, tx);
    const seats = [];
    for (let rowIndex = 0; rowIndex < params.rows; rowIndex += 1) {
      const row = indexToRow(rowIndex);
      for (let column = 1; column <= params.columns; column += 1) {
        seats.push({ venueId: venue.id, row, column });
      }
    }
    await tx.seat.createMany({ data: seats });
    return venue;
  });
}

export async function removeVenue(venueId: string) {
  const venue = await findVenueById(venueId);
  if (!venue) {
    throw new NotFoundError(`Venue ${venueId} not found`);
  }

  return deleteVenueRecord(venueId);
}

export async function getVenueStatus(venueId: string) {
  const venue = await findVenueById(venueId);
  if (!venue) {
    throw new NotFoundError(`Venue ${venueId} not found`);
  }

  const seats = await listSeatsForVenue(venueId);
  return {
    id: venue.id,
    name: venue.name,
    layout: { rows: venue.rows, columns: venue.columns },
    seats: seats.map(toAlgorithmSeat),
  };
}

export async function getBestSeats(venueId: string, partySize: number): Promise<BestSeatsResult> {
  const venue = await findVenueById(venueId);
  if (!venue) {
    throw new NotFoundError(`Venue ${venueId} not found`);
  }

  const seats = await listSeatsForVenue(venueId);
  const seatMap: VenueSeatMap = {
    venue: { layout: { rows: venue.rows, columns: venue.columns } },
    seats: Object.fromEntries(seats.map((seat) => [seat.id, toAlgorithmSeat(seat)])),
  };

  const result = findBestSeats(seatMap, partySize);
  if (!result) {
    throw new NoAvailableSeatsError();
  }
  return result;
}
