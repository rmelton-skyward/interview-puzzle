import type { Seat, VenueSeatMap } from '../schemas/venue.js';

/**
 * Converts a spreadsheet-style row label ("a", "b", ..., "z", "aa", "ab", ...) to a
 * zero-based index, so multi-letter rows are supported for venues with 26+ rows.
 */
export function rowToIndex(row: string): number {
  let result = 0;
  for (const char of row.toLowerCase()) {
    const value = char.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    result = result * 26 + value;
  }
  return result - 1;
}

export interface BestSeatsResult {
  row: string;
  seats: Seat[];
}

/**
 * Finds the best contiguous block of `partySize` available seats for a venue.
 *
 * Rules (from README-BE.md):
 * - A seat in a closer (smaller-index) row always beats any seat in a farther row.
 * - For a party size > 1, seats must be contiguous within the same row.
 * - Ties (equidistant from the row's center) are broken by preferring the lower
 *   (leftmost) seat numbers.
 *
 * Returns `null` if no row has a contiguous block large enough for `partySize`.
 */
export function findBestSeats(input: VenueSeatMap, partySize: number): BestSeatsResult | null {
  if (partySize <= 0) {
    throw new RangeError('partySize must be a positive integer');
  }

  const { columns } = input.venue.layout;
  const venueCenter = (columns + 1) / 2;

  const seatsByRow = new Map<string, Map<number, Seat>>();
  for (const seat of Object.values(input.seats)) {
    if (!seatsByRow.has(seat.row)) {
      seatsByRow.set(seat.row, new Map());
    }
    seatsByRow.get(seat.row)!.set(seat.column, seat);
  }

  const rowsSorted = [...seatsByRow.keys()].sort(
    (a, b) => rowToIndex(a) - rowToIndex(b),
  );
  for (const row of rowsSorted) {
    const rowSeats = seatsByRow.get(row)!;
    const best = findBestWindowInRow(rowSeats, partySize, venueCenter);
    if (best) {
      return { row, seats: best };
    }
  }

  return null;
}

/**
 * Scans a single row for the best contiguous block of `partySize` AVAILABLE seats,
 * scored by distance of the block's center from the venue's center column.
 */
function findBestWindowInRow(
  rowSeats: Map<number, Seat>,
  partySize: number,
  venueCenter: number,
): Seat[] | null {
  const availableColumns = [...rowSeats.entries()]
    .filter(([, seat]) => seat.status === 'AVAILABLE')
    .map(([column]) => column)
    .sort((a, b) => a - b);

  let bestScore = Infinity;
  let bestStart = -1;

  let runStart = 0;
  for (let i = 0; i < availableColumns.length; i++) {
    const isContiguous = i > 0 && availableColumns[i] === availableColumns[i - 1] + 1;
    if (!isContiguous) {
      runStart = i;
    }
    const runLength = i - runStart + 1;
    if (runLength >= partySize) {
      // Window ending at index i, spanning `partySize` columns.
      const windowStartIdx = i - partySize + 1;
      const startColumn = availableColumns[windowStartIdx];
      const endColumn = availableColumns[i];
      const blockCenter = (startColumn + endColumn) / 2;
      const score = Math.abs(blockCenter - venueCenter);

      if (score < bestScore || (score === bestScore && startColumn < bestStart)) {
        bestScore = score;
        bestStart = startColumn;
      }
    }
  }

  if (bestStart === -1) {
    return null;
  }

  const seats: Seat[] = [];
  for (let column = bestStart; column < bestStart + partySize; column++) {
    seats.push(rowSeats.get(column)!);
  }
  return seats;
}
