# AGENTS.md — Frontend

Read `../AGENTS.md` first for shared-type rules, TypeScript strictness, and repo
conventions — including the project's requirement tier (mid-level is the floor,
senior-level is opportunistic). This file covers Angular structure and — most
importantly — the RxJS state management pattern. Follow it precisely; don't
drift toward NgRx-style actions/reducers or an ad hoc mix of patterns across
features.

## Stack

- **Angular**, standalone components (no `NgModule`s except where Angular
  itself still requires one, e.g. bootstrapping)
- **RxJS**, hand-rolled store pattern (below) — no NgRx, no Akita, no other
  state library
- **Jest** for unit tests (via `jest-preset-angular`), not Angular's default
  Jasmine/Karma
- **Tailwind CSS** for styling — utility-first, mobile-first

## Folder structure

Kept flat and simple — this project doesn't need a deep core/features/shared
split:

```
src/
├── app/
│   ├── components/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── seat-map/
│   │   │   ├── seat-map.component.ts
│   │   │   ├── seat.component.ts
│   │   │   └── seat-map.component.spec.ts
│   │   └── booking/
│   │       ├── party-size-input.component.ts
│   │       ├── booking-summary.component.ts
│   │       └── booking-confirmation.component.ts
│   ├── services/
│   │   ├── venue-api.service.ts       thin HTTP wrapper, one per resource
│   │   ├── seats-api.service.ts
│   │   └── booking-api.service.ts
│   ├── state/
│   │   ├── venue.store.ts              see RxJS pattern below
│   │   ├── seat-selection.store.ts
│   │   └── booking.store.ts
│   ├── app.component.ts
│   ├── app.config.ts                   standalone bootstrap providers
│   └── app.routes.ts                   standalone routing
├── assets/
├── environments/
├── main.ts
├── index.html
└── styles.css                          Tailwind directives live here
```

- **`components/`**: every component, one folder each. No further nesting by
  feature needed at this size — flat is easier to navigate than a deep tree
  for a handful of components.
- **`services/`**: API wrappers only — one per backend resource, thin, no
  business logic beyond mapping HTTP responses to shared types.
- **`state/`**: the RxJS stores (below). Kept separate from `services/`
  because stores and API calls have different responsibilities and different
  test strategies — don't merge them into one file per resource.
- Local view-model types, if you need any beyond what
  `@yourorg/shared-types` provides, live next to the component that uses
  them rather than in a shared `models/` folder — add one only if the same
  local type is genuinely reused across components.

## The RxJS store pattern — follow this shape exactly

Each store is a plain injectable class with:
- a **private** `BehaviorSubject` holding state,
- a **public readonly `Observable`** (or several derived selector
  observables) exposed via `.asObservable()` or `pipe(map(...))`,
- **public methods** that are the only way to mutate state (never expose the
  subject itself, never let a component call `.next()` directly).

```
// state/seat-selection.store.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Seat } from '@yourorg/shared-types';

interface SeatSelectionState {
  partySize: number | null;
  bestSeats: Seat[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const initialState: SeatSelectionState = {
  partySize: null,
  bestSeats: [],
  status: 'idle',
  error: null,
};

@Injectable({ providedIn: 'root' })
export class SeatSelectionStore {
  private readonly state$$ = new BehaviorSubject<SeatSelectionState>(initialState);

  readonly state$: Observable<SeatSelectionState> = this.state$$.asObservable();
  readonly bestSeats$: Observable<Seat[]> = this.state$.pipe(map((s) => s.bestSeats));
  readonly isLoading$: Observable<boolean> = this.state$.pipe(map((s) => s.status === 'loading'));

  setLoading(partySize: number): void {
    this.patch({ partySize, status: 'loading', error: null });
  }

  setBestSeats(seats: Seat[]): void {
    this.patch({ bestSeats: seats, status: 'success' });
  }

  setError(message: string): void {
    this.patch({ status: 'error', error: message });
  }

  reset(): void {
    this.state$$.next(initialState);
  }

  private patch(partial: Partial<SeatSelectionState>): void {
    this.state$$.next({ ...this.state$$.value, ...partial });
  }
}
```

Rules that follow from this pattern:
- **One store per bounded concern** (venue/seat-map data, seat-selection
  request state, booking flow state) — don't merge everything into one giant
  store, and don't create a new store per component either.
- Components **inject the store and the API service separately**; the
  component's job is to call the API service, then call store methods with
  the result. Stores never make HTTP calls themselves — that keeps them
  trivially testable without HTTP mocking.
- Use the `async` pipe in templates to subscribe to store observables. Avoid
  manual `.subscribe()` in components except where you need to trigger a
  side effect (like a toast) — and always take care of unsubscription
  (`takeUntilDestroyed()`) when you do.
- State shape is always a single interface with a `status` discriminant
  (`'idle' | 'loading' | 'success' | 'error'`) rather than separate loose
  booleans — this avoids impossible states like `loading: true, error: '...'`
  existing simultaneously.

## Component conventions

- Standalone components, `ChangeDetectionStrategy.OnPush` everywhere.
- `trackBy` (or Angular's built-in track expression in control flow syntax)
  on every seat-grid loop — a large venue re-rendering every seat on each
  status change is the main perf risk in this app.
- Keep components thin: presentation + store/API wiring. Push any nontrivial
  logic (formatting, derived calculations) into small pure functions or
  pipes, not inline in templates.

## Performance optimization — lazy loading (senior requirement)

This is the primary "at least one performance optimization" item to call out
in the README — it's concrete, easy to demonstrate, and easy to explain.

- This app is a single-screen flow (seat map → party size → best seats →
  booking → confirmation), not a multi-route app, so **route-level
  `loadComponent` lazy loading isn't the natural fit here** — there's nothing
  to defer until navigation, since there's effectively one route.
- Instead, use Angular's **`@defer` block** to lazy-load the booking
  confirmation/summary component: it has no reason to be in the initial
  bundle since it isn't rendered until the user has actually selected seats
  and clicked "Book."

  ```html
  <!-- in the page shell, once seats are selected -->
  @defer (on interaction) {
    <app-booking-summary [seats]="selectedSeats" />
  } @placeholder {
    <button class="...">Review booking</button>
  } @loading {
    <span>Loading…</span>
  }
  ```

  `on interaction` (deferring until the "Review booking" trigger is clicked)
  is a better trigger than `on viewport` here, since the summary is
  meaningfully gated behind a user action, not just scroll position.
- If the app grows a genuinely separate route later (e.g. a standalone
  `/confirmation/:bookingId` page reached after a page reload), that's where
  `loadComponent` in `app.routes.ts` would apply instead — keep that pattern
  in mind but don't force a route split into this app just to use it.
- Document this choice explicitly in the README (what's deferred, and why)
  — the senior requirement is as much about the rationale as the mechanism.

## Styling — Tailwind

- Utility-first: reach for Tailwind classes directly in templates rather
  than writing custom CSS files per component. Use `@apply` sparingly, only
  for a genuinely repeated cluster of utilities (e.g. a "seat button" base
  style), not as a default habit.
- **Mobile-first breakpoints**: write base (unprefixed) classes for small
  screens, then layer `sm:` / `md:` / `lg:` to scale up — don't design
  desktop-first and retrofit mobile with overrides.
- Configure `tailwind.config.js` `content` paths to cover every component
  template (`src/app/**/*.{html,ts}`), including inline templates, or
  utility classes used only in an inline template will get purged.
- Accessible focus states are not optional: interactive elements need a
  visible `focus-visible:ring-*` (or equivalent) style, not the browser
  default suppressed with no replacement.
- Keep a small shared set of design tokens (spacing scale, seat-status
  colors) in `tailwind.config.js` `theme.extend` rather than scattering
  arbitrary values (`bg-[#3b82f6]`) through templates.

## Accessibility (mid-level requirement)

- Every seat is a real `<button>` (not a `<div>` with a click handler), with
  `aria-label` describing row, column, and status, e.g. `aria-label="Seat A5,
  available"`.
- Selected/best-available seats get `aria-pressed` or `aria-selected` as
  appropriate, not just a Tailwind color class.
- The seat grid should be keyboard-navigable — arrow keys or tab order
  should let a user reach and "select" a seat without a mouse. Tab order
  alone (native button focus) is an acceptable baseline for this project;
  full arrow-key grid navigation is a nice bonus, not a requirement.
- Form inputs (party size) need associated `<label>` elements, not just
  placeholder text.
- Status changes (booking confirmed, error) should be announced via an
  `aria-live` region, not conveyed by color alone.

## Responsive design (mid-level requirement)

- Mobile-first Tailwind utilities as described above.
- The seat grid needs a distinct small-screen strategy (e.g. horizontal
  scroll with sticky row labels, or a zoomed-out overview + tap-to-zoom)
  rather than just letting seats wrap and lose their spatial meaning — row/
  column position is the whole point of the UI.

## Testing (Jest)

- Store tests: subscribe to the relevant observable, call store methods,
  assert emitted values — no Angular `TestBed` needed since stores are plain
  injectables. Use `jest.fn()` for any injected collaborators.
- Component tests: focus on behavior (does clicking "Book" call the right
  service method, does the loading state disable the button) rather than
  testing Angular's own template binding. Use `jest.spyOn` on services for
  assertions like `toHaveBeenCalledWith`.
- Keep it to a small number of meaningful tests per component — one happy
  path, one error/edge case — rather than exhaustive DOM assertions.
- Make sure `jest.config.js` / `setup-jest.ts` (via `jest-preset-angular`) is
  wired up before writing tests — a broken Angular+Jest harness is a common
  time sink; verify one trivial test runs green before building out real
  coverage.
