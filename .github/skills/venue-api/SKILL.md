---
name: venue-api
description: Use when adding or changing Express API routes, venue or booking behavior, request validation, Prisma/PostgreSQL access, migrations, OpenAPI docs, or backend tests in this repository.
---

# Venue and Booking API

## Architecture

The backend is a TypeScript/Express layered monolith:

```text
Express route -> Zod validation -> service -> repository/Prisma -> PostgreSQL
```

Routes are in `backend/src/routes/`, request schemas in `backend/src/schemas/`, business workflows in `backend/src/services/`, and data access in `backend/src/repositories/`. Keep HTTP handling out of repositories and keep persistence out of the seat-selection algorithm.

## Project Conventions

- Validate request bodies with Zod and use the shared `validateBody` middleware.
- Use typed application errors from `backend/src/errors.ts` so the central error handler produces consistent status codes and error payloads.
- Add/update Swagger JSDoc on routes when changing the API contract.
- Update integration tests in `backend/tests/integration/` for route and database behavior; unit-test pure logic under `backend/tests/unit/`.
- Venue creation generates seats transactionally. Venue deletion relies on the Prisma schema's cascade relations for seats, bookings, and booking-seat rows.
- Venue names are 1–30 characters and unique case-insensitively; return a conflict for duplicates. Layouts accept 1–50 rows and 1–1,000 columns. Keep the Zod schema, Swagger annotations, and API boundary tests aligned when changing these limits.
- Before the server listens, `ensureDefaultVenue` creates one 10×20 Default Venue only when no venues exist. It does not replace existing data; `npm run db:seed` is a separate destructive sample-data command.
- Booking must remain explicit and separate from recommendation. Preserve validation that requested seats exist, belong to the venue, and are available.
- Venue create/delete use optional `ADMIN_TOKEN` protection. Keep local behavior aligned with `backend/src/middleware/adminAuth.ts` and do not expose or commit secrets.
- The seat assistant uses OpenAI only to extract structured preferences; validate its output and delegate seat choice to the deterministic selector. The OpenAI key is optional for non-AI API functionality.
- Do not claim a database row lock unless the repository query actually issues one; transactions and row-level locks are distinct.

## Database Changes

When changing `backend/prisma/schema.prisma`:

1. Create a migration with `npm run db:migrate` for local development.
2. Regenerate Prisma Client with `npm run db:generate` if needed.
3. Update seed data, schemas, repository/service logic, and tests where applicable.
4. Never edit an already-applied migration to represent a new schema change; add a new migration.

## Validation

From `backend/`:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Integration tests require the PostgreSQL service from the repository's Docker Compose setup. For focused work, run the nearest test file first, then the full suite when the change crosses route/service/database boundaries.
