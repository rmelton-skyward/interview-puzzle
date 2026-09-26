import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED';

type VenueSummary = {
  id: string;
  name: string;
  rows: number;
  columns: number;
};

type Seat = {
  id: string;
  row: string;
  column: number;
  status: SeatStatus;
};

function seatLabel(seat: Pick<Seat, 'row' | 'column'>): string {
  return `${seat.row.toUpperCase()}${seat.column}`;
}

type VenueDetail = {
  id: string;
  name: string;
  layout: { rows: number; columns: number };
  seats: Seat[];
};

type BookingSeatReference = {
  id?: string;
  seat?: {
    id?: string;
  };
};

type BookingResponse = {
  id: string;
  venueId: string;
  partySize: number;
  seatIds?: string[];
  seats?: BookingSeatReference[];
};

function extractSeatIds(booking: BookingResponse | undefined): string[] {
  if (!booking) {
    return [];
  }

  if (Array.isArray(booking.seatIds)) {
    return booking.seatIds.filter((seatId): seatId is string => Boolean(seatId));
  }

  return (booking.seats ?? [])
    .map((seatEntry) => seatEntry?.seat?.id ?? seatEntry?.id)
    .filter((seatId): seatId is string => Boolean(seatId));
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message ?? errorPayload?.message ?? message;
    } catch {
      // Ignore JSON parsing failures and keep the default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function rowLabelFromIndex(index: number): string {
  let n = index + 1;
  let value = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    value = String.fromCharCode(97 + remainder) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}

function App() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [bestSeats, setBestSeats] = useState<Seat[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venueLoading, setVenueLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [isVenueManagerOpen, setIsVenueManagerOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState('New Venue');
  const [newVenueRows, setNewVenueRows] = useState('10');
  const [newVenueColumns, setNewVenueColumns] = useState('12');
  const [adminToken, setAdminToken] = useState('');
  const [venueManagementError, setVenueManagementError] = useState('');
  const [venueManagementStatus, setVenueManagementStatus] = useState('');
  const [venueManagementLoading, setVenueManagementLoading] = useState(false);

  useEffect(() => {
    async function loadVenues() {
      try {
        setVenuesLoading(true);
        setVenuesError(null);
        const data = await requestJson<VenueSummary[]>('/api/venues');
        setVenues(data);
        if (!selectedVenueId && data[0]) {
          setSelectedVenueId(data[0].id);
        }
      } catch (error) {
        setVenuesError(error instanceof Error ? error.message : 'Unable to load venues.');
      } finally {
        setVenuesLoading(false);
      }
    }

    void loadVenues();
  }, [selectedVenueId]);

  useEffect(() => {
    if (!selectedVenueId) {
      return;
    }

    async function loadVenueDetail() {
      try {
        setVenueLoading(true);
        setVenueError(null);
        const data = await requestJson<VenueDetail>(`/api/venues/${selectedVenueId}`);
        setVenueDetail(data);
      } catch (error) {
        setVenueError(error instanceof Error ? error.message : 'Unable to load venue details.');
      } finally {
        setVenueLoading(false);
      }
    }

    void loadVenueDetail();
  }, [selectedVenueId]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues],
  );

  async function handleCreateVenue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      const created = await requestJson<VenueSummary>('/api/venues', {
        method: 'POST',
        headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
        body: JSON.stringify({
          name: newVenueName,
          rows: Number(newVenueRows),
          columns: Number(newVenueColumns),
        }),
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      setSelectedVenueId(created.id);
      setBestSeats([]);
      setVenueManagementStatus(`${created.name} was added with ${Number(newVenueRows) * Number(newVenueColumns)} seats.`);
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to add venue.');
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleDeleteVenue() {
    if (!selectedVenueId || !selectedVenue) {
      return;
    }

    if (!window.confirm(`Delete ${selectedVenue.name}? Its seats and bookings will also be deleted.`)) {
      return;
    }

    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      await requestJson<void>(`/api/venues/${selectedVenueId}`, {
        method: 'DELETE',
        headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      setSelectedVenueId(refreshedVenues[0]?.id ?? '');
      setVenueDetail(null);
      setBestSeats([]);
      setVenueManagementStatus(`${selectedVenue.name} and its seats and bookings were deleted.`);
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to delete venue.');
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleFindBestSeats() {
    if (!selectedVenueId) {
      return;
    }

    try {
      setStatusError('');
      setStatusMessage('');
      const result = await requestJson<{ row?: string; seats: Seat[] }>(`/api/venues/${selectedVenueId}/best-seats`, {
        method: 'POST',
        body: JSON.stringify({ partySize }),
      });
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`Recommended seats are in ${rowLabel}. First row, centered view.`);
    } catch (error) {
      setBestSeats([]);
      setStatusError(error instanceof Error ? error.message : 'Unable to find best seats.');
    }
  }

  async function handleAskAssistant() {
    if (!selectedVenueId || assistantPrompt.trim().length < 3) {
      return;
    }

    try {
      setAssistantLoading(true);
      setStatusError('');
      setStatusMessage('');
      const result = await requestJson<{ preferences: { partySize: number }; row?: string; seats: Seat[] }>(
        `/api/venues/${selectedVenueId}/seat-assistant`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: assistantPrompt }),
        },
      );
      setPartySize(result.preferences.partySize);
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`AI found ${result.preferences.partySize} seat${result.preferences.partySize === 1 ? '' : 's'} in ${rowLabel}.`);
    } catch (error) {
      setBestSeats([]);
      setStatusError(error instanceof Error ? error.message : 'The AI seat assistant failed.');
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleBookSeats() {
    if (!selectedVenueId || bestSeats.length === 0) {
      return;
    }

    try {
      setStatusError('');
      const result = await requestJson<BookingResponse>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          venueId: selectedVenueId,
          seatIds: bestSeats.map((seat) => seat.id),
        }),
      });

      const confirmedSeatIds = extractSeatIds(result);
      const confirmedSeatLabels = confirmedSeatIds.map((seatId) => {
        const seat = bestSeats.find((candidate) => candidate.id === seatId);
        return seat ? seatLabel(seat) : seatId;
      });
      setStatusMessage(
        confirmedSeatLabels.length > 0
          ? `Booking confirmed for seats ${confirmedSeatLabels.join(', ')}.`
          : 'Booking confirmed.',
      );
      const refreshed = await requestJson<VenueDetail>(`/api/venues/${selectedVenueId}`);
      setVenueDetail(refreshed);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Booking failed.');
    }
  }

  const venueRows = venueDetail?.layout.rows ?? selectedVenue?.rows ?? 0;
  const venueCols = venueDetail?.layout.columns ?? selectedVenue?.columns ?? 0;
  const displayRows = venueRows;
  const displayCols = venueCols;
  const seatMap = useMemo(() => {
    const map = new Map<string, Seat>();
    for (const seat of venueDetail?.seats ?? []) {
      map.set(seat.id, seat);
      map.set(`${seat.row}${seat.column}`.toLowerCase(), seat);
    }
    return map;
  }, [venueDetail]);

  const bestSeatIds = new Set(bestSeats.map((seat) => seat.id));
  const bestSeatDisplayIds = new Set(bestSeats.map((seat) => `${String(seat.row).toLowerCase()}${seat.column}`));

  function renderSeatGrid() {
    if (venueLoading) {
      return <p className="text-sm text-slate-300">Loading venue layout…</p>;
    }

    if (!venueDetail) {
      return <p className="text-sm text-slate-300">Select a venue to view the seat map.</p>;
    }

    return (
      <div className="cinema-map overflow-x-auto rounded-[1.75rem] border border-amber-100/10 bg-[#11100f] p-4 shadow-2xl shadow-black/30 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200/60">Venue floor</p>
            <h2 className="mt-1 text-xl font-semibold text-amber-50">{venueDetail.name}</h2>
          </div>
          <span className="rounded-full border border-amber-100/15 bg-amber-50/5 px-3 py-1 text-xs font-medium text-amber-100/70">
            {displayRows} × {displayCols}
          </span>
        </div>

        <div className="movie-screen mb-8">
          <div className="text-center text-[10px] font-semibold uppercase tracking-[0.45em] text-[#17120f]">Stage</div>
        </div>

        <div className="min-w-max space-y-3 px-1 md:px-4">
          {Array.from({ length: displayRows }, (_, rowIndex) => {
            const rowName = rowLabelFromIndex(rowIndex);
            return (
              <div key={rowName} className="relative flex w-full justify-center">
                <div className="absolute right-full mr-3 w-5 text-right text-[10px] font-bold tracking-widest text-amber-100/45">{rowName.toUpperCase()}</div>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: displayCols }, (_, columnIndex) => {
                const column = columnIndex + 1;
                const displaySeatId = `${rowName}${column}`;
                const seat = seatMap.get(displaySeatId) ?? {
                  id: `${rowName}${column}`,
                  row: rowName,
                  column,
                  status: 'AVAILABLE',
                } as Seat;
                const isBestSeat = bestSeatIds.has(seat.id) || bestSeatDisplayIds.has(`${String(seat.row).toLowerCase()}${seat.column}`);
                const aisleGap = venueCols >= 10 && column === Math.ceil(venueCols / 2) ? 'mr-5' : '';
                const seatClasses = {
                  AVAILABLE: isBestSeat
                    ? 'border-[#f8d47a] bg-[#efb84b] text-[#25170d] shadow-[0_0_18px_rgba(239,184,75,0.55)]'
                    : 'border-[#77624b] bg-[#29221d] text-amber-50/75 hover:border-[#d6a55a] hover:bg-[#3a2d23]',
                  RESERVED: 'border-[#d6a55a] bg-[#75552f] text-amber-50',
                  BOOKED: 'border-[#6f3d38] bg-[#4a2928] text-[#d8aaa3] opacity-80',
                }[seat.status];

                return (
                  <button
                    key={seat.id}
                    type="button"
                    aria-label={`Seat ${seat.id} ${seat.status.toLowerCase()}`}
                    className={`seat-tile flex h-8 w-8 items-center justify-center rounded-t-lg rounded-b-[0.6rem] border text-[10px] font-semibold transition ${aisleGap} ${seatClasses}`}
                    disabled={seat.status !== 'AVAILABLE'}
                  >
                    {column}
                  </button>
                );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-amber-100/10 pt-4 text-[11px] uppercase tracking-wider text-amber-50/55">
          <span className="flex items-center gap-2"><i className="legend-dot available" /> Available</span>
          <span className="flex items-center gap-2"><i className="legend-dot recommended" /> Recommended</span>
          <span className="flex items-center gap-2"><i className="legend-dot reserved" /> Reserved</span>
          <span className="flex items-center gap-2"><i className="legend-dot booked" /> Booked</span>
        </div>
      </div>
    );
  }

  return (
    <main className="cinema-shell mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/75">Live event seating</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#fff4dc] md:text-5xl">Choose your seats</h1>
          <p className="mt-2 max-w-xl text-sm text-[#c8b9a4]">Find a centered view near the front, then reserve your place for the show.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVenueManagerOpen(true);
            setVenueManagementError('');
            setVenueManagementStatus('');
          }}
          className="rounded-xl border border-amber-100/20 bg-[#211b17] px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-300 hover:bg-[#2b2119]"
        >
          Manage Venues
        </button>
      </div>

      {isVenueManagerOpen ? (
        <div className="mb-6 rounded-2xl border border-amber-100/15 bg-[#211b17] p-5 shadow-2xl shadow-black/20" role="dialog" aria-label="Manage venues">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200/55">Venue administration</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#fff4dc]">Manage Venues</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsVenueManagerOpen(false)}
              className="rounded-lg border border-amber-100/15 px-3 py-1.5 text-sm text-amber-100/70 transition hover:border-amber-300 hover:text-amber-100"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={handleCreateVenue} className="rounded-xl border border-amber-100/10 bg-[#171311] p-4">
              <h3 className="text-lg font-semibold text-[#fff4dc]">Add a venue</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm text-[#eadcc6] sm:col-span-3">
                  <span>Admin token (optional)</span>
                  <input
                    type="password"
                    value={adminToken}
                    onChange={(event) => setAdminToken(event.target.value)}
                    placeholder="Only required when ADMIN_TOKEN is configured"
                    className="rounded-lg border border-amber-100/15 bg-[#11100f] px-3 py-2 text-[#fff4dc] outline-none placeholder:text-[#8f8172] focus:border-amber-300"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-[#eadcc6] sm:col-span-3">
                  <span>Venue name</span>
                  <input
                    value={newVenueName}
                    onChange={(event) => setNewVenueName(event.target.value)}
                    required
                    className="rounded-lg border border-amber-100/15 bg-[#11100f] px-3 py-2 text-[#fff4dc] outline-none focus:border-amber-300"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-[#eadcc6]">
                  <span>Rows</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newVenueRows}
                    onChange={(event) => setNewVenueRows(event.target.value)}
                    required
                    className="rounded-lg border border-amber-100/15 bg-[#11100f] px-3 py-2 text-[#fff4dc] outline-none focus:border-amber-300"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-[#eadcc6]">
                  <span>Columns</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newVenueColumns}
                    onChange={(event) => setNewVenueColumns(event.target.value)}
                    required
                    className="rounded-lg border border-amber-100/15 bg-[#11100f] px-3 py-2 text-[#fff4dc] outline-none focus:border-amber-300"
                  />
                </label>
                <button
                  type="submit"
                  disabled={venueManagementLoading}
                  className="rounded-lg bg-[#efb84b] px-3 py-2 text-sm font-semibold text-[#25170d] transition hover:bg-[#f8d47a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {venueManagementLoading ? 'Working…' : 'Add Venue'}
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-rose-300/15 bg-[#211417] p-4">
              <h3 className="text-lg font-semibold text-[#fff4dc]">Delete selected venue</h3>
              <p className="mt-2 text-sm leading-6 text-[#c8b9a4]">
                Deleting a venue permanently removes its seats, bookings, and booking-seat records.
              </p>
              <button
                type="button"
                onClick={handleDeleteVenue}
                disabled={!selectedVenueId || venueManagementLoading}
                className="mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete {selectedVenue?.name ?? 'Selected Venue'}
              </button>
            </div>
          </div>

          {venueManagementStatus ? <p className="mt-4 text-sm text-emerald-300">{venueManagementStatus}</p> : null}
          {venueManagementError ? <p className="mt-4 text-sm text-rose-300">{venueManagementError}</p> : null}
        </div>
      ) : null}

      {venuesError || venueError ? (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100">
          {(venuesError ?? venueError) ?? 'Unable to load data.'}
        </div>
      ) : null}

      {venuesLoading ? (
        <div className="rounded-xl border border-amber-100/10 bg-[#211b17] p-6 text-amber-50/60">Loading venues…</div>
      ) : (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-100/10 bg-[#211b17] p-4 shadow-xl shadow-black/10 md:flex-row md:items-end md:justify-between">
          <label className="flex flex-col gap-2 text-sm text-[#eadcc6]">
            <span className="font-medium text-amber-100/70">Auditorium</span>
            <select
              value={selectedVenueId}
              onChange={(event) => setSelectedVenueId(event.target.value)}
              className="rounded-xl border border-amber-100/15 bg-[#11100f] px-3 py-2 text-base text-[#fff4dc] outline-none ring-0 transition focus:border-amber-300"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="party-size" className="flex flex-col gap-2 text-sm text-[#eadcc6]">
            <span className="font-medium text-amber-100/70">Party size</span>
            <input
              id="party-size"
              value={partySize}
              min={1}
              max={Math.max(venueCols, 1)}
              type="number"
              onChange={(event) => {
                const rawValue = event.target.value;
                const nextValue = rawValue === '' ? 1 : Math.max(1, Number(rawValue));
                setPartySize(nextValue);
              }}
              className="w-28 rounded-xl border border-amber-100/15 bg-[#11100f] px-3 py-2 text-base text-[#fff4dc] outline-none transition focus:border-amber-300"
            />
          </label>

          <button
            type="button"
            onClick={handleFindBestSeats}
            disabled={!selectedVenueId}
            className="rounded-xl bg-[#efb84b] px-4 py-2.5 text-sm font-semibold text-[#25170d] transition hover:bg-[#f8d47a] disabled:cursor-not-allowed disabled:bg-[#4b4035] disabled:text-[#b8aa99]"
          >
            Find Best Seats
          </button>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-amber-100/10 bg-[#211b17] p-4 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label htmlFor="assistant-prompt" className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-[#eadcc6]">
            <span className="font-medium text-amber-100/70">Ask the seat assistant</span>
            <input
              id="assistant-prompt"
              value={assistantPrompt}
              onChange={(event) => setAssistantPrompt(event.target.value)}
              placeholder="Example: I need seats for a group of 4"
              className="rounded-xl border border-amber-100/15 bg-[#11100f] px-3 py-2 text-base text-[#fff4dc] outline-none transition placeholder:text-[#8f8172] focus:border-amber-300"
            />
          </label>
          <button
            type="button"
            onClick={handleAskAssistant}
            disabled={!selectedVenueId || assistantPrompt.trim().length < 3 || assistantLoading}
            className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assistantLoading ? 'Thinking…' : 'Ask AI'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#9f9181]">The assistant interprets your request; the seat algorithm makes the final recommendation.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section>{renderSeatGrid()}</section>

        <aside className="rounded-2xl border border-amber-100/10 bg-[#211b17] p-5 shadow-xl shadow-black/10">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200/55">Your reservation</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#fff4dc]">Best available seats</h2>

          {statusMessage ? <p className="mt-3 text-sm text-emerald-300">{statusMessage}</p> : null}
          {statusError ? <p className="mt-3 text-sm text-rose-300">{statusError}</p> : null}

          {bestSeats.length ? (
            <>
              <p className="mt-5 text-sm text-[#c8b9a4]">Recommended seats:</p>
              <div className="mt-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-medium text-amber-100">
                {bestSeats.map((seat) => `${seat.row.toUpperCase()}${seat.column}`).join(', ')}
              </div>

              <button
                type="button"
                onClick={handleBookSeats}
                disabled={bestSeats.length === 0}
                className="mt-5 w-full rounded-xl bg-[#efb84b] px-4 py-2.5 font-semibold text-[#25170d] transition hover:bg-[#f8d47a] disabled:cursor-not-allowed disabled:bg-[#4b4035] disabled:text-[#b8aa99]"
              >
                Book These Seats
              </button>
            </>
          ) : (
            <p className="mt-4 text-sm text-[#c8b9a4]">
              Choose a venue and party size to see the best contiguous seats.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

export default App;
