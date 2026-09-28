# Seat Selection Frontend

React and TypeScript application for browsing venue seating, finding recommended seats, managing venues, and booking seats. It uses Vite for development/build, Tailwind CSS for styling, and Vitest with React Testing Library for tests.

## Run Locally

Prerequisites: Node.js 20.19+ or 22.12+. Start PostgreSQL and the backend first using the [backend setup guide](../backend/README.md). Run the frontend in a separate terminal from the repository root.

macOS/Linux:
```bash
cd frontend
if [ ! -f .env ]; then cp .env.example .env; fi
npm ci
npm run dev
```

Windows PowerShell:
```powershell
Set-Location frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev
```

Windows Command Prompt:
```bat
cd frontend
if not exist .env copy .env.example .env
npm ci
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. The local `.env.example` points API requests to `http://localhost:4000`.

## Run the Full Stack in Docker

From the repository root, build and start PostgreSQL, the API, and the Nginx-hosted frontend:

```bash
docker compose up --build
```

Nginx serves the frontend and proxies `/api/` and `/docs` to the backend, so browser requests use the frontend origin. The default host ports are frontend `5173`, API `4000`, and PostgreSQL `5434`. If any are already in use, set alternate ports before starting Compose.

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

With those example overrides, open `http://localhost:5174`; the API is directly available at `http://localhost:4001`. Compose does not load sample seed data, but on an empty database the API creates one **Default Venue** (10 rows × 20 columns). To load the sample venues instead, use the backend guide's `db:seed` command, which replaces existing application data. Stop the stack with `docker compose down`; add `-v` only to remove the database volume too.

## Tests and Build

```bash
npm test
npm run typecheck
npm run build
npm run lint
```

## Component Structure

Current source layout:

```text
src/
  main.tsx                 React entry point
  App.tsx                  Page-level state, API calls, and workflow orchestration
  index.css                Global styles
  Components/              Page sections and shared UI types
  test/                    Frontend tests and test setup
```

`src/App.tsx` currently owns shared state and API workflows. Page sections are split into `src/Components/`:

| Component | Responsibility |
|---|---|
| `Header` | Page heading and Manage Venues action |
| `ManageVenue` | Add/delete venue interface and local form input state |
| `VenueControls` | Venue and party-size controls; composes `FindBestSeats` |
| `FindBestSeats` | Trigger for deterministic seat recommendations |
| `AskAI` | Natural-language seat request input |
| `VenueFloorSeating` | Stage, seat map, availability states, and recommendation highlights |
| `BookSeats` | Recommendation summary, status messages, and booking action |
| `BookingConfirmation` | Dismissible booking-success dialog |
| `types.ts` | Shared venue and seat types |

## State and Data Flow

The page uses React's built-in `useState`, `useEffect`, and `useMemo` hooks. Shared state such as the venue list, selected venue, party size, recommended seats, and request status stays in `App.tsx`; child components receive values and callbacks through props. `ManageVenue` owns its temporary form fields and independent delete-venue selection, and resets its fields when opened.

### Venue and Booking Behavior

- Venue names are required, limited to 30 characters in the input, and duplicate names are blocked
  case-insensitively. The API enforces the same constraints.
- Venue layouts allow up to 50 rows and 1,000 columns. Party size is limited to the selected venue's
  column count.
- The Delete Venue dropdown is independent of the main venue picker and requires inline confirmation
  before deletion.
- With no venues, the page offers **Create Venue** and hides venue-management and reservation
  controls.
- Successful bookings appear in a dismissible confirmation dialog. Venue create/delete notices are
  shown in their relevant form sections; page-level notices dismiss automatically after 10 seconds.

Effects load the venue list and selected venue's seat map. User actions call the backend APIs; recommendation results are passed to `VenueFloorSeating` and `BookSeats`. The AI assistant only interprets the natural-language request; the backend's deterministic algorithm selects seats, and booking remains a separate explicit action.

TanStack Query and Zustand are present in the package dependencies but are not currently used for application state or data fetching.

## Scaling the Frontend

Keep the present component boundaries for the current feature size. As independent workflows grow, move their state, API functions, components, and tests into feature-owned folders (for example, `features/booking/` and `features/venues/`) and keep genuinely shared UI and types under a shared directory. Treat that as an incremental extraction from `App.tsx`, not a required up-front rewrite. Add a server-state library such as TanStack Query only when caching, request deduplication, or invalidation needs justify it; it is installed but not currently used.

The frontend CI workflow is not currently configured; the available local checks are `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint`.
