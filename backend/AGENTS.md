# AGENTS.md — Backend

Read `../AGENTS.md` first for shared-type rules, TypeScript strictness, and repo
conventions — including the project's requirement tier (mid-level is the floor,
senior-level is opportunistic). This file covers NestJS-specific structure, the
seat algorithm, and database access.

## Stack

- **NestJS** (modules, controllers, providers, DI)
- **PostgreSQL via `pg`** (node-postgres) — **no ORM**. This project's data
  model is small enough that an ORM adds ceremony without earning its keep;
  what matters is that every query is parameterized and reviewable.
- **class-validator** / **class-transformer** for DTO validation
- **@nestjs/swagger** for OpenAPI docs
- **Jest** for unit + integration tests (Nest's default)

## Module structure

Organize by feature, not by technical layer:

```
src/
├── main.ts
├── app.module.ts
├── db/
│   ├── pool.ts                   single pg Pool instance, provided via DI
│   └── db.module.ts
├── algorithm/
│   ├── seat-selector.ts          pure function, no Nest dependencies
│   └── seat-selector.spec.ts
├── venue/
│   ├── venue.module.ts
│   ├── venue.controller.ts
│   ├── venue.service.ts
│   ├── venue.repository.ts       all SQL for this feature lives here
│   └── dto/
├── seats/
│   ├── seats.module.ts
│   ├── seats.controller.ts
│   ├── seats.service.ts
│   ├── seats.repository.ts
│   └── dto/
└── booking/
    ├── booking.module.ts
    ├── booking.controller.ts
    ├── booking.service.ts
    ├── booking.repository.ts
    └── dto/
```

`db/migrations/` at the backend root holds plain numbered `.sql` files
(`001_create_venues.sql`, `002_create_seats.sql`, ...). Run them via a tiny
startup script or `docker-compose`'s Postgres init-scripts mechanism — no
migration framework needed at this scale, but keep each migration file
idempotent-safe to re-run in dev.

## Database access — SQL injection is a hard rule

Because there's no ORM standing between application code and SQL, this is the
single most important rule in this file:

- **Every query is parameterized. No exceptions.** Use `pg`'s placeholder
  syntax (`$1`, `$2`, ...) and pass values as the second argument to
  `pool.query()`. Never build a query string by concatenating or
  template-interpolating a value that came from user input, a request body,
  or a route param.

  Correct:
  ```
  const result = await pool.query(
    'SELECT id, row, "column", status FROM seats WHERE venue_id = $1',
    [venueId],
  );
  ```

  Never do this:
  ```
  const result = await pool.query(
    `SELECT * FROM seats WHERE venue_id = '${venueId}'`,
  );
  ```

- If a query ever needs a **dynamic identifier** (table or column name,
  rather than a value) — which should be rare in this project — never
  interpolate raw user input into that position either. Prefer a small
  allow-list/switch mapping known-safe identifiers, since parameterization
  doesn't cover identifiers.
- All SQL lives in `*.repository.ts` files, one per feature, never inline in
  a controller or service. This makes every query easy to find and review in
  one pass for injection risk.
- Repositories return plain typed rows; services own any business logic and
  mapping to shared types. Controllers never touch `pool` directly.

## The seat-selection algorithm — design contract

This is the most heavily scrutinized piece of the challenge, so treat it with
extra care.

- **Location**: `src/algorithm/seat-selector.ts`. It must be a **pure
  function** — no Nest decorators, no DI, no database access. Input: venue
  layout + seat map + party size. Output: an ordered list of seat IDs, or a
  clear "not available" result. This makes it trivially unit-testable and
  reusable if the frontend ever wants a client-side preview.
- **Rules to implement** (from the challenge spec):
  - Closer rows always beat farther rows, regardless of centering — a
    front-row seat is preferred over a better-centered but further-back seat.
  - Within a row, prefer the block of seats closest to horizontal center.
  - For party size > 1, seats **must be contiguous** within a single row.
  - If no contiguous block of the requested size exists in a row, that row is
    disqualified for the group and the next-closest row is checked.
  - If no valid block exists anywhere, return an explicit "no availability"
    result — don't throw, and don't silently return an empty array without a
    reason code.
- **Test against the spec's own examples first**, verbatim, then add: party
  size larger than the venue, party size equal to the whole row, a fully
  booked venue, odd vs. even column counts (center-seat tie-breaking
  differs), and a row with a gap too small for the party in the middle.

## API endpoints

Match the challenge spec's shape:

| Method | Path | Purpose |
|---|---|---|
| GET | `/venue` | Current venue layout + seat statuses |
| POST | `/seats/best` | Given `{ partySize }`, return the best available seat IDs (does not book them) |
| POST | `/bookings` | Given seat IDs (+ optional customer info), persist a booking, mark seats `RESERVED` |
| GET | `/bookings/:id` | Retrieve a booking confirmation (supports a confirmation page) |

- Request/response bodies are DTO classes with `class-validator` decorators,
  and their shapes should mirror (or extend) the interfaces in
  `@yourorg/shared-types` — don't let the DTO and the shared type drift apart.
- Validation failures return **400** with a structured error body (field +
  message), not a raw stack trace.
- Booking a seat that's already reserved returns **409 Conflict**, not a
  generic 500 or a silent success.
- Wire up a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted:
  true })` in `main.ts` so unexpected fields are rejected rather than
  silently dropped.

## Transactions

Wrap the multi-seat "reserve these seats" write in a single transaction so a
partial booking can't happen if one seat was taken between the best-seat
lookup and the booking call:

```
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... parameterized inserts/updates using client.query(), not pool.query()
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

This is also where row-level locking would hook in for the concurrent-booking
bonus later — don't build that now, but don't write the transaction in a way
that makes it hard to add (`SELECT ... FOR UPDATE` slots in naturally here).

## Error handling

- Use Nest's built-in `HttpException` subclasses (`BadRequestException`,
  `ConflictException`, `NotFoundException`) rather than hand-rolled error
  objects — this keeps status codes and response shapes consistent for free.
- Add a global exception filter only if you need to normalize the error body
  shape beyond what Nest gives you by default.

## Testing

- **Algorithm**: exhaustive unit tests in `seat-selector.spec.ts`, no mocking
  needed since it's a pure function.
- **Repositories**: unit test with a mocked `pg` `Pool`/`Client` (e.g. via
  `jest.mock` or a lightweight test double), not a real database, for fast
  unit coverage — plus a small set of integration tests that run against a
  real Postgres instance (Docker) to catch actual SQL mistakes.
- **Controllers**: integration tests using Nest's `TestingModule` +
  `supertest`.
- Keep the test count focused: one thorough suite for the algorithm, a
  handful of integration tests covering the happy path plus the two or three
  error cases per endpoint (validation failure, not-found, conflict). Don't
  pad numbers.

## OpenAPI

- Use `@nestjs/swagger` decorators (`@ApiTags`, `@ApiOperation`,
  `@ApiResponse`) on controllers, and expose `/api/docs` via
  `SwaggerModule.setup` in `main.ts`. This satisfies the mid-level API
  documentation requirement without a separate hand-written spec to keep in
  sync.
