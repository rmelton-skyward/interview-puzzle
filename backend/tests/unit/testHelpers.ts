import type { Seat, VenueSeatMap } from '../../src/schemas/venue.js';

/**
 * Builds a fully-seeded venue seat map for tests: every seat in `rows` x `columns`
 * is AVAILABLE by default, except those listed in `occupiedRows` (whole rows marked
 * RESERVED) or `occupiedSeatIds` (individual seat ids marked RESERVED).
 */
export function buildVenue(
  rows: number,
  columns: number,
  options: { occupiedRows?: string[]; occupiedSeatIds?: string[] } = {},
): VenueSeatMap {
  const occupiedRows = new Set(options.occupiedRows ?? []);
  const occupiedSeatIds = new Set(options.occupiedSeatIds ?? []);

  const seats: Record<string, Seat> = {};
  for (let r = 0; r < rows; r++) {
    const row = indexToRow(r);
    for (let column = 1; column <= columns; column++) {
      const id = `${row}${column}`;
      seats[id] = {
        id,
        row,
        column,
        status:
          occupiedRows.has(row) || occupiedSeatIds.has(id) ? 'RESERVED' : 'AVAILABLE',
      };
    }
  }

  return { venue: { layout: { rows, columns } }, seats };
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
