import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ensureDefaultVenue } from '../../src/services/venueService.js';

function createDatabase(existingVenue: { id: string } | null) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    venue: {
      findFirst: vi.fn().mockResolvedValue(existingVenue),
      create: vi.fn().mockResolvedValue({ id: 'default-venue' }),
    },
    seat: {
      createMany: vi.fn().mockResolvedValue({ count: 200 }),
    },
  };
  const database = {
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
  } as unknown as PrismaClient;

  return { database, tx };
}

describe('ensureDefaultVenue', () => {
  it('creates the 10 by 20 default venue and all seats when none exist', async () => {
    const { database, tx } = createDatabase(null);

    await ensureDefaultVenue(database);

    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(tx.venue.create).toHaveBeenCalledWith({
      data: { name: 'Default Venue', rows: 10, columns: 20 },
    });
    expect(tx.seat.createMany).toHaveBeenCalledOnce();
    const [{ data: seats }] = tx.seat.createMany.mock.calls[0];
    expect(seats).toHaveLength(200);
    expect(seats[0]).toMatchObject({ row: 'a', column: 1 });
    expect(seats[199]).toMatchObject({ row: 'j', column: 20 });
  });

  it('does not add a default when any venue already exists', async () => {
    const { database, tx } = createDatabase({ id: 'existing-venue' });

    await ensureDefaultVenue(database);

    expect(tx.venue.create).not.toHaveBeenCalled();
    expect(tx.seat.createMany).not.toHaveBeenCalled();
  });
});