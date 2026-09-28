---
name: seat-selection
description: Use when changing, debugging, or explaining the venue seat-selection algorithm, recommendation behavior, row/column mapping, or seat recommendation tests in this repository.
---

# Seat Selection Algorithm

## Purpose

Keep seat recommendations deterministic and consistent with the venue requirements. The algorithm lives in `backend/src/algorithm/seatSelector.ts` and should remain independent of Express, Prisma, and external AI services.

## Domain Rules

- Consider only `AVAILABLE` seats.
- A contiguous group must fit in one row; seats separated by unavailable seats do not form a valid group.
- Prefer the closest/front-most row that can fit the complete group.
- Within that row, prefer the contiguous block closest to the row center. Break equal-distance ties by choosing the lower starting column.
- Return `null` when no row contains a valid block.
- Row labels use spreadsheet-style names (`a` through `z`, then `aa`, etc.); keep `rowToIndex` ordering correct for multi-letter labels.
- Recommendation is read-only. Booking is a separate operation.
- The venue API currently permits at most 50 rows and 1,000 columns. Keep those request limits in
   the Zod schema and API tests; do not couple transport validation to this pure selector.

## Workflow

1. Read the algorithm, its schema types, and the nearest relevant tests before changing behavior.
2. Keep input and output typed with the venue schemas. Do not add database or HTTP concerns to the pure algorithm.
3. Add or update focused unit tests for the rule being changed, including ties, occupied seats, gaps, and later-row fallback where relevant.
4. If a change alters the API contract, update the route validation, OpenAPI annotations, service call, and API tests as well.
5. Run from `backend/`:

   ```bash
   npm test -- --run tests/unit/seatSelector.test.ts
   npm run build
   ```

6. For API/service changes, also run the relevant integration test file; integration tests require PostgreSQL.

## Important Boundaries

- AI may interpret natural language into validated preferences, but must not choose arbitrary seats or bypass this algorithm.
- Do not book seats from the recommendation endpoint.
- When discussing concurrency, verify whether a query actually obtains a database lock. A Prisma transaction alone does not imply row-level locking.
