import { useEffect, useMemo, useRef, useState } from 'react';
import AskAI from './Components/AskAI';
import BookSeats from './Components/BookSeats';
import BookingConfirmation from './Components/BookingConfirmation';
import Header from './Components/Header';
import ManageVenue from './Components/ManageVenue';
import VenueControls from './Components/VenueControls';
import VenueFloorSeating from './Components/VenueFloorSeating';
import type { CreateVenueInput, Seat, VenueDetail, VenueSummary } from './Components/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function seatLabel(seat: Pick<Seat, 'row' | 'column'>): string {
  return `${seat.row.toUpperCase()}${seat.column}`;
}

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

function App() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [partySizeDraft, setPartySizeDraft] = useState('2');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [bestSeats, setBestSeats] = useState<Seat[]>([]);
  const [bookingConfirmation, setBookingConfirmation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venueLoading, setVenueLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [isVenueManagerOpen, setIsVenueManagerOpen] = useState(false);
  const [venueManagementError, setVenueManagementError] = useState('');
  const [venueManagementStatus, setVenueManagementStatus] = useState('');
  const [venueManagementStatusType, setVenueManagementStatusType] = useState<'' | 'create' | 'delete'>('');
  const [venueManagementLoading, setVenueManagementLoading] = useState(false);
  const [venueManagerOpenVersion, setVenueManagerOpenVersion] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const venueManagerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const venueSelectionVersion = useRef(0);
  const recommendationRequestId = useRef(0);
  const assistantRequestId = useRef(0);
  const bookingRequestId = useRef(0);

  useEffect(() => () => {
    if (venueManagerCloseTimer.current) {
      clearTimeout(venueManagerCloseTimer.current);
    }
  }, []);

  useEffect(() => {
    if (!venueManagementStatus || isVenueManagerOpen) {
      return;
    }

    const timer = window.setTimeout(() => setVenueManagementStatus(''), 10_000);
    return () => window.clearTimeout(timer);
  }, [isVenueManagerOpen, venueManagementStatus]);

  useEffect(() => {
    async function loadVenues() {
      try {
        setVenuesLoading(true);
        setVenuesError(null);
        const data = await requestJson<VenueSummary[]>('/api/venues');
        setVenues(data);
      } catch (error) {
        setVenuesError(error instanceof Error ? error.message : 'Unable to load venues.');
      } finally {
        setVenuesLoading(false);
      }
    }

    void loadVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) {
      return;
    }

    let isCurrentRequest = true;

    async function loadVenueDetail() {
      try {
        setVenueLoading(true);
        setVenueError(null);
        const data = await requestJson<VenueDetail>(`/api/venues/${selectedVenueId}`);
        if (isCurrentRequest) {
          setVenueDetail(data);
        }
      } catch (error) {
        if (isCurrentRequest) {
          setVenueError(error instanceof Error ? error.message : 'Unable to load venue details.');
        }
      } finally {
        if (isCurrentRequest) {
          setVenueLoading(false);
        }
      }
    }

    void loadVenueDetail();
    return () => {
      isCurrentRequest = false;
    };
  }, [selectedVenueId]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues],
  );

  function handleVenueChange(venueId: string) {
    if (venueId === selectedVenueId) {
      return;
    }

    venueSelectionVersion.current += 1;
    recommendationRequestId.current += 1;
    assistantRequestId.current += 1;
    bookingRequestId.current += 1;
    setSelectedVenueId(venueId);
    setVenueDetail(null);
    setVenueLoading(Boolean(venueId));
    setVenueError(null);
    setBestSeats([]);
    setStatusMessage('');
    setStatusError('');
    setBookingConfirmation('');
    setAssistantError('');
    setAssistantLoading(false);
    setIsAskAiOpen(false);
    setBookingLoading(false);
  }

  function closeVenueManager() {
    if (venueManagerCloseTimer.current) {
      clearTimeout(venueManagerCloseTimer.current);
      venueManagerCloseTimer.current = null;
    }
    setIsVenueManagerOpen(false);
  }

  function closeVenueManagerAfterSuccess() {
    if (venueManagerCloseTimer.current) {
      clearTimeout(venueManagerCloseTimer.current);
    }
    venueManagerCloseTimer.current = setTimeout(() => {
      venueManagerCloseTimer.current = null;
      setIsVenueManagerOpen(false);
    }, 1400);
  }

  function openVenueManager() {
    if (venueManagerCloseTimer.current) {
      clearTimeout(venueManagerCloseTimer.current);
      venueManagerCloseTimer.current = null;
    }
    setVenueManagerOpenVersion((version) => version + 1);
    setIsVenueManagerOpen(true);
    setVenueManagementError('');
    setVenueManagementStatus('');
    setVenueManagementStatusType('');
  }

  function openAskAi() {
    setAssistantPrompt('');
    setAssistantError('');
    setStatusMessage('');
    setIsAskAiOpen(true);
  }

  async function handleCreateVenue(input: CreateVenueInput): Promise<boolean> {
    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      setVenueManagementStatusType('');
      const created = await requestJson<VenueSummary>('/api/venues', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      handleVenueChange(created.id);
      setVenueManagementStatus(`${created.name} was added with ${input.rows * input.columns} seats.`);
      setVenueManagementStatusType('create');
      closeVenueManagerAfterSuccess();
      return true;
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to add venue.');
      return false;
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleDeleteVenue(venueId: string): Promise<boolean> {
    const venueToDelete = venues.find((venue) => venue.id === venueId);
    if (!venueToDelete) return false;

    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      setVenueManagementStatusType('');
      await requestJson<void>(`/api/venues/${venueId}`, {
        method: 'DELETE',
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      if (selectedVenueId === venueId) {
        handleVenueChange(refreshedVenues[0]?.id ?? '');
      }
      setVenueManagementStatus(`${venueToDelete.name} and its seats and bookings were deleted.`);
      setVenueManagementStatusType('delete');
      closeVenueManagerAfterSuccess();
      return true;
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to delete venue.');
      return false;
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleFindBestSeats() {
    const partySize = Number(partySizeDraft);
    const maximumPartySize = selectedVenue?.columns ?? 0;
    if (
      !selectedVenueId
      || !/^\d+$/.test(partySizeDraft)
      || !Number.isSafeInteger(partySize)
      || partySize < 1
      || partySize > maximumPartySize
    ) {
      return;
    }

    const selectionVersion = venueSelectionVersion.current;
    const requestId = ++recommendationRequestId.current;
    setBestSeats([]);
    try {
      setStatusError('');
      setStatusMessage('');
      const result = await requestJson<{ row?: string; seats: Seat[] }>(`/api/venues/${selectedVenueId}/best-seats`, {
        method: 'POST',
        body: JSON.stringify({ partySize }),
      });
      if (selectionVersion !== venueSelectionVersion.current || requestId !== recommendationRequestId.current) {
        return;
      }
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`Recommended seats are in ${rowLabel}. First row, centered view.`);
    } catch (error) {
      if (selectionVersion === venueSelectionVersion.current && requestId === recommendationRequestId.current) {
        setStatusError(error instanceof Error ? error.message : 'Unable to find best seats.');
      }
    }
  }

  async function handleAskAssistant() {
    if (!selectedVenueId || assistantPrompt.trim().length < 3) {
      return;
    }

    const venueId = selectedVenueId;
    const selectionVersion = venueSelectionVersion.current;
    const requestId = ++recommendationRequestId.current;
    const currentAssistantRequestId = ++assistantRequestId.current;
    setBestSeats([]);
    try {
      setAssistantLoading(true);
      setAssistantError('');
      setStatusMessage('');
      const result = await requestJson<{ preferences: { partySize: number }; row?: string; seats: Seat[] }>(
        `/api/venues/${venueId}/seat-assistant`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: assistantPrompt }),
        },
      );
      if (selectionVersion !== venueSelectionVersion.current || requestId !== recommendationRequestId.current) {
        return;
      }
      setPartySizeDraft(String(result.preferences.partySize));
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`AI found ${result.preferences.partySize} seat${result.preferences.partySize === 1 ? '' : 's'} in ${rowLabel}.`);
      setIsAskAiOpen(false);
    } catch (error) {
      if (selectionVersion === venueSelectionVersion.current && requestId === recommendationRequestId.current) {
        setAssistantError(error instanceof Error ? error.message : 'The AI seat assistant failed.');
      }
    } finally {
      if (currentAssistantRequestId === assistantRequestId.current) {
        setAssistantLoading(false);
      }
    }
  }

  async function handleBookSeats() {
    if (!selectedVenueId || bestSeats.length === 0 || bookingLoading) {
      return;
    }

    const venueId = selectedVenueId;
    const seatsToBook = bestSeats;
    const selectionVersion = venueSelectionVersion.current;
    const requestId = ++bookingRequestId.current;
    const isCurrentBooking = () =>
      selectionVersion === venueSelectionVersion.current && requestId === bookingRequestId.current;

    setBookingLoading(true);
    try {
      setStatusError('');
      const result = await requestJson<BookingResponse>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          venueId,
          seatIds: seatsToBook.map((seat) => seat.id),
        }),
      });
      if (!isCurrentBooking()) {
        return;
      }

      const confirmedSeatIds = extractSeatIds(result);
      const confirmedSeatLabels = confirmedSeatIds.map((seatId) => {
        const seat = seatsToBook.find((candidate) => candidate.id === seatId);
        return seat ? seatLabel(seat) : seatId;
      });
      setBookingConfirmation(
        confirmedSeatLabels.length > 0
          ? `Booking confirmed for seats ${confirmedSeatLabels.join(', ')}.`
          : 'Booking confirmed.',
      );
      setStatusMessage('');
      setBestSeats([]);
      try {
        const refreshed = await requestJson<VenueDetail>(`/api/venues/${venueId}`);
        if (isCurrentBooking()) {
          setVenueDetail(refreshed);
        }
      } catch {
        if (isCurrentBooking()) {
          setStatusError('Booking was confirmed, but the venue could not be refreshed. Reload the venue to see current availability.');
        }
      }
    } catch (error) {
      if (isCurrentBooking()) {
        setStatusError(error instanceof Error ? error.message : 'Booking failed.');
      }
    } finally {
      if (requestId === bookingRequestId.current) {
        setBookingLoading(false);
      }
    }
  }

  return (
    <main className="app-shell">
      <Header
        hasVenues={venues.length > 0}
        onManageVenues={openVenueManager}
      />

      <ManageVenue
        key={venueManagerOpenVersion}
        isOpen={isVenueManagerOpen}
        isLoading={venueManagementLoading}
        error={venueManagementError}
        status={venueManagementStatus}
        statusType={venueManagementStatusType}
        venues={venues}
        onClose={closeVenueManager}
        onCreate={handleCreateVenue}
        onDelete={handleDeleteVenue}
      />

      {!isVenueManagerOpen && venueManagementStatus ? (
        <div className="venue-management-notice" role="status" aria-live="polite">
          <span>{venueManagementStatus}</span>
          <button
            type="button"
            className="notice-dismiss"
            aria-label="Dismiss venue notification"
            onClick={() => setVenueManagementStatus('')}
          >
            ×
          </button>
        </div>
      ) : null}

      {venuesError || venueError ? (
        <div className="error-banner">
          {(venuesError ?? venueError) ?? 'Unable to load data.'}
        </div>
      ) : null}

      <VenueControls
        venues={venues}
        selectedVenueId={selectedVenueId}
        partySizeDraft={partySizeDraft}
        maxPartySize={selectedVenue?.columns ?? 1}
        isLoading={venuesLoading}
        onVenueChange={handleVenueChange}
        onPartySizeChange={setPartySizeDraft}
        onFindBestSeats={handleFindBestSeats}
        onOpenAskAi={openAskAi}
        onCreateVenue={openVenueManager}
      />

      <AskAI
        isOpen={isAskAiOpen}
        prompt={assistantPrompt}
        isLoading={assistantLoading}
        isDisabled={!selectedVenueId || assistantPrompt.trim().length < 3}
        error={assistantError}
        onPromptChange={setAssistantPrompt}
        onAsk={handleAskAssistant}
        onClose={() => setIsAskAiOpen(false)}
      />

      <BookingConfirmation
        message={bookingConfirmation}
        onClose={() => setBookingConfirmation('')}
      />

      <div className="content-grid">
        <section>
          <VenueFloorSeating
            venue={venueDetail}
            isLoading={venueLoading}
            hasVenues={venues.length > 0}
            recommendedSeats={bestSeats}
          />
        </section>
        {venues.length > 0 ? (
          <BookSeats
            recommendedSeats={bestSeats}
            statusMessage={statusMessage}
            statusError={isAskAiOpen ? '' : statusError}
            isBooking={bookingLoading}
            onBook={handleBookSeats}
          />
        ) : null}
      </div>
    </main>
  );
}

export default App;
