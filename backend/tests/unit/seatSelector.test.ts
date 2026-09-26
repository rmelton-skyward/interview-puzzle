import { describe, expect, it } from 'vitest';
import { findBestSeats, rowToIndex } from '../../src/algorithm/seatSelector.js';
import { buildVenue } from './testHelpers.js';

describe('rowToIndex', () => {
  it('converts single letters to zero-based indices', () => {
    expect(rowToIndex('a')).toBe(0);
    expect(rowToIndex('b')).toBe(1);
    expect(rowToIndex('z')).toBe(25);
  });

  it('supports multi-letter rows for venues with 26+ rows', () => {
    expect(rowToIndex('aa')).toBe(26);
    expect(rowToIndex('ab')).toBe(27);
  });
});

describe('findBestSeats — documented examples from README-BE.md', () => {
  it('picks A6 as the single best seat in a 10x12 venue with all seats open', () => {
    const venue = buildVenue(10, 12);
    const result = findBestSeats(venue, 1);
    expect(result?.row).toBe('a');
    expect(result?.seats.map((s) => s.id)).toEqual(['a6']);
  });

  it('picks A5, A6, A7 for a party of 3 in the same venue', () => {
    const venue = buildVenue(10, 12);
    const result = findBestSeats(venue, 3);
    expect(result?.seats.map((s) => s.id)).toEqual(['a5', 'a6', 'a7']);
  });

  it('picks B2, B3 when row A is fully occupied in a 5-column venue', () => {
    const venue = buildVenue(2, 5, { occupiedRows: ['a'] });
    const result = findBestSeats(venue, 2);
    expect(result?.row).toBe('b');
    expect(result?.seats.map((s) => s.id)).toEqual(['b2', 'b3']);
  });

  it('prioritizes the front row when seats are available', () => {
    const venue = buildVenue(3, 5);

    expect(findBestSeats(venue, 2)?.row).toBe('a');
  });
});

describe('findBestSeats — edge cases', () => {
  it('throws for a non-positive party size', () => {
    const venue = buildVenue(1, 5);
    expect(() => findBestSeats(venue, 0)).toThrow(RangeError);
    expect(() => findBestSeats(venue, -1)).toThrow(RangeError);
  });

  it('returns null when no row has enough contiguous seats', () => {
    // Row A: only seat 1 free (blocked at 2-5); too small for a party of 2.
    const venue = buildVenue(1, 5, { occupiedSeatIds: ['a2', 'a3', 'a4', 'a5'] });
    const result = findBestSeats(venue, 2);
    expect(result).toBeNull();
  });

  it('returns null when the venue has no seats at all', () => {
    const venue = { venue: { layout: { rows: 1, columns: 5 } }, seats: {} };
    expect(findBestSeats(venue, 1)).toBeNull();
  });

  it('falls back to a farther row when the closer row cannot fit the party contiguously', () => {
    // Row A has 2 separate single free seats (1 and 5) — not contiguous for party of 2.
    // Row B is fully open, so the group must be seated there instead.
    const venue = buildVenue(2, 5, { occupiedSeatIds: ['a2', 'a3', 'a4'] });
    const result = findBestSeats(venue, 2);
    expect(result?.row).toBe('b');
    expect(result?.seats.map((s) => s.id)).toEqual(['b2', 'b3']);
  });

  it('only considers AVAILABLE seats as part of a contiguous run', () => {
    const venue = buildVenue(1, 5, { occupiedSeatIds: ['a3'] });
    // Columns 1-2 and 4-5 are free but split by occupied seat 3; party of 3 cannot fit.
    const result = findBestSeats(venue, 3);
    expect(result).toBeNull();
  });

  it('handles a party size equal to the entire row width', () => {
    const venue = buildVenue(1, 5);
    const result = findBestSeats(venue, 5);
    expect(result?.seats.map((s) => s.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
});
