# Seat Selection System Setup

This guide is for reviewers who want to run and test the application. For components, architecture diagrams, API flows, data model, and scaling considerations, see [Architecture.md](Architecture.md).

## Prerequisites

- Git, if cloning the repository
- Docker Desktop with Compose on Windows/macOS, or Docker Engine with the Compose plugin on Linux
- Node.js 20.19+ or 22.12+ for local development outside Docker

## Environment Profiles

The existing `backend/.env` is the development/demo profile and remains in use for local development. Docker Compose defaults `NODE_ENV` to `development` for the demo.

For production, start from [`backend/.env.production.example`](backend/.env.production.example), copy it to the ignored `backend/.env.production`, replace every placeholder, and set `NODE_ENV=production` before starting the backend. Production mode rejects a missing/short `ADMIN_TOKEN` and wildcard `CORS_ORIGIN`. Do not commit either real environment file; use your deployment platform's secret manager for deployed production credentials.

## Option 1: Run the Full Stack in Docker

From the repository root, build and start PostgreSQL, the API, and the frontend:

```bash
docker compose up --build
```

Open the application at `http://localhost:5173`. The frontend container serves the static app through Nginx and proxies `/api/` and `/docs` to the API. The API is also available directly at `http://localhost:4000`; PostgreSQL is published on port `5434`. Compose applies migrations, and the API creates a **Default Venue** with 10 rows and 20 columns on startup only if no venues exist. It does not add sample venues when any venue is already present. Venue names are limited to 30 characters; layouts can have up to 50 rows and 1,000 columns.

Stop the stack with `docker compose down`. This keeps the database volume. Use `docker compose down -v` only if you also want to delete the database data.

### If a Default Port Is Already in Use

Defaults are frontend `5173`, API `4000`, and PostgreSQL `5434`. Choose available host ports using these variables.

macOS/Linux:

```bash
POSTGRES_HOST_PORT=5435 API_HOST_PORT=4001 FRONTEND_HOST_PORT=5174 docker compose up --build
```

Windows PowerShell:

```powershell
$env:POSTGRES_HOST_PORT = '5435'
$env:API_HOST_PORT = '4001'
$env:FRONTEND_HOST_PORT = '5174'
docker compose up --build
```

With the example values, open `http://localhost:5174`; the API is directly available at `http://localhost:4001`.

## Option 2: Local Development

Run the database and backend in one terminal, and the frontend in another. Commands begin at the repository root.

### macOS/Linux: Terminal 1 (database and backend)

```bash
docker compose up -d postgres
cd backend
if [ ! -f .env ]; then cp .env.example .env; fi
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run db:seed` clears existing bookings and venues before creating sample layouts. Do not run it
against a database whose data you need to retain. The API's default-venue initializer does not clear
existing data.

### Windows PowerShell: Terminal 1 (database and backend)

```powershell
docker compose up -d postgres
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The backend is available at `http://localhost:4000`. PostgreSQL is published on host port `5434`. The seed command adds sample venues. To enable the AI assistant during local development, set `OPENAI_API_KEY` in `backend/.env`; it is optional for the rest of the application.

### macOS/Linux: Terminal 2 (frontend)

From the repository root:

```bash
cd frontend
if [ ! -f .env ]; then cp .env.example .env; fi
npm ci
npm run dev
```

### Windows PowerShell: Terminal 2 (frontend)

From the repository root:

```powershell
Set-Location frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev
```

Open `http://localhost:5173`. The local frontend configuration sends API requests to `http://localhost:4000`.

## Verify

- Open the frontend at `http://localhost:5173` (or the override port you selected).
- Check API and database connectivity at `http://localhost:4000/api/health` (or the selected API host port).
- Open Swagger UI at `http://localhost:4000/docs` (or `http://localhost:5173/docs` when using the Nginx frontend proxy).
- Select or create a venue, request a seat recommendation, then book the suggested seats.

## Run Tests and Quality Checks

Run backend commands from `backend/`. PostgreSQL must be running for integration tests:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Run frontend commands from `frontend/`:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Stop Local Development

Press `Ctrl+C` in both development-server terminals. From the repository root, stop PostgreSQL:

```bash
docker compose down
```

This retains database data. Add `-v` to remove the database volume too.

## More Detail

- [Architecture and system design](Architecture.md)
- [Backend setup, APIs, and implementation details](backend/README.md)
- [Frontend setup, components, and state management](frontend/README.md)
