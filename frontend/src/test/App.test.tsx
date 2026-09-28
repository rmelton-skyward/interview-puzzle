import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const mockFetch = vi.fn();

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);

  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/venues') && !url.includes('/best-seats') && !url.includes('/api/venues/')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { id: 'venue-1', name: 'Main Hall', rows: 2, columns: 5 },
          { id: 'venue-2', name: 'Balcony', rows: 2, columns: 5 },
        ],
      } as Response);
    }

    if (url.includes('/api/venues/venue-2') && !url.includes('/best-seats')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'venue-2',
          name: 'Balcony',
          layout: { rows: 1, columns: 5 },
          seats: [
            { id: 'a1', row: 'a', column: 1, status: 'BOOKED' },
            { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
            { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
            { id: 'a4', row: 'a', column: 4, status: 'AVAILABLE' },
            { id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' },
          ],
        }),
      } as Response);
    }

    if (url.includes('/seat-assistant')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          preferences: { partySize: 2 },
          row: 'a',
          seats: [
            { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
            { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
          ],
        }),
      } as Response);
    }

    if (url.includes('/api/venues/venue-1') && !url.includes('/best-seats')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'venue-1',
          name: 'Main Hall',
          layout: { rows: 2, columns: 5 },
          seats: [
            { id: 'a1', row: 'a', column: 1, status: 'AVAILABLE' },
            { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
            { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
            { id: 'a4', row: 'a', column: 4, status: 'AVAILABLE' },
            { id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' },
            { id: 'b1', row: 'b', column: 1, status: 'AVAILABLE' },
            { id: 'b2', row: 'b', column: 2, status: 'AVAILABLE' },
            { id: 'b3', row: 'b', column: 3, status: 'AVAILABLE' },
            { id: 'b4', row: 'b', column: 4, status: 'AVAILABLE' },
            { id: 'b5', row: 'b', column: 5, status: 'AVAILABLE' },
          ],
        }),
      } as Response);
    }

    if (url.includes('/best-seats')) {
      const isBalcony = url.includes('/api/venues/venue-2/');
      return Promise.resolve({
        ok: true,
        json: async () => ({
          row: 'a',
          seats: isBalcony
            ? [
                { id: 'balcony-a2', row: 'a', column: 2, status: 'AVAILABLE' },
                { id: 'balcony-a3', row: 'a', column: 3, status: 'AVAILABLE' },
              ]
            : [
                { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
                { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
              ],
        }),
      } as Response);
    }

    if (url.includes('/api/bookings')) {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'booking-1',
          venueId: 'venue-1',
          partySize: 2,
          seats: [
            { seat: { id: 'a2' } },
            { seat: { id: 'a3' } },
          ],
        }),
      } as Response);
    }

    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
});

describe('App', () => {
  it('fetches the venue and shows the best available seats for a party size', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /choose your seats/i })).toBeInTheDocument();
    const venueSelect = await screen.findByRole('combobox', { name: /^venue$/i });
    expect(venueSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: /select a venue/i })).toBeDisabled();
    expect(screen.getByText('Choose a venue and party size to see the best contiguous seats.')).toBeInTheDocument();
    expect(screen.getByText('Select a venue to view the seat map.')).toBeInTheDocument();
    await user.selectOptions(venueSelect, 'venue-1');
    expect(await screen.findByRole('heading', { name: 'Main Hall' })).toBeInTheDocument();

    const input = await screen.findByLabelText(/party size/i);
    await user.clear(input);
    await user.type(input, '9');
    expect(input).toHaveValue(5);
    await user.clear(input);
    await user.type(input, '2');
    await user.click(screen.getByRole('button', { name: /find best seats/i }));

    expect(await screen.findByText(/recommended seats are in/i)).toBeInTheDocument();
    expect(screen.getByText(/a2, a3/i)).toBeInTheDocument();
    const bestSeatsRequest = mockFetch.mock.calls.find(([url]) => String(url).includes('/best-seats'));
    expect(JSON.parse(String(bestSeatsRequest?.[1]?.body))).toMatchObject({ partySize: 2 });

    expect(screen.getByRole('img', { name: /seat a2 available/i })).toHaveClass('seat-recommended');
    expect(screen.getByRole('img', { name: /seat a3 available/i })).toHaveClass('seat-recommended');
    expect(screen.queryByRole('button', { name: /seat a2 available/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /book these seats/i }));

    const confirmation = await screen.findByRole('dialog', { name: /booking confirmed/i });
    expect(within(confirmation).getByText('Booking confirmed for seats A2, A3.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book these seats/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /seat a2 available/i })).toHaveClass('seat-available');
    await user.click(within(confirmation).getByRole('button', { name: /close booking confirmation/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /booking confirmed/i })).not.toBeInTheDocument());
  });

  it('keeps the stage centered on the seat track for a 500-column venue', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues') && !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'wide-venue', name: 'Wide Hall', rows: 1, columns: 500 }],
        } as Response);
      }
      if (url.endsWith('/api/venues/wide-venue') && !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'wide-venue',
            name: 'Wide Hall',
            layout: { rows: 1, columns: 500 },
            seats: [],
          }),
        } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'wide-venue');

    const stage = await screen.findByText('Stage');
    const firstSeat = await screen.findByRole('img', { name: /seat a1 available/i });
    const contentTrack = stage.closest('.seat-map-content');
    expect(contentTrack).not.toBeNull();
    expect(firstSeat.closest('.seat-map-content')).toBe(contentTrack);
  });

  it('opens Ask AI only when requested, submits the prompt, and closes on success', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    expect(screen.queryByRole('dialog', { name: /ask ai/i })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /^ask ai$/i }));

    const dialog = screen.getByRole('dialog', { name: /ask ai/i });
    const prompt = within(dialog).getByRole('textbox', { name: /your request/i });
    expect(prompt).toHaveFocus();
    await user.type(prompt, 'I need two seats');
    await user.click(within(dialog).getByRole('button', { name: /find seats/i }));

    expect(await screen.findByText(/ai found 2 seats in row a/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /ask ai/i })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    expect(within(screen.getByRole('dialog', { name: /ask ai/i })).getByRole('textbox', { name: /your request/i })).toHaveValue('');

    const assistantRequest = mockFetch.mock.calls.find(([url]) => String(url).includes('/seat-assistant'));
    expect(JSON.parse(String(assistantRequest?.[1]?.body))).toEqual({ prompt: 'I need two seats' });
  });

  it('clears the previous recommendation on venue switch and finds seats for the new venue on request', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    expect(await screen.findByText(/a2, a3/i)).toBeInTheDocument();

    const venueSelect = screen.getByRole('combobox', { name: /^venue$/i });
    await user.selectOptions(venueSelect, 'venue-2');

    expect(venueSelect).toHaveValue('venue-2');
    expect(await screen.findByRole('img', { name: /seat a1 booked/i })).toBeInTheDocument();
    expect(screen.queryByText(/^A2, A3$/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /find best seats/i }));
    expect(await screen.findByText(/^A2, A3$/)).toBeInTheDocument();
    const recommendations = mockFetch.mock.calls.filter(([url]) => String(url).includes('/best-seats'));
    expect(String(recommendations[1]?.[0])).toContain('/api/venues/venue-2/best-seats');
  });

  it('ignores late venue detail and recommendation responses after switching venues', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let resolveOldDetail: (response: Response) => void = () => {};
    let resolveOldRecommendation: (response: Response) => void = () => {};
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues/venue-1') && !init?.method) {
        return new Promise<Response>((resolve) => {
          resolveOldDetail = resolve;
        });
      }
      if (url.includes('/api/venues/venue-1/best-seats')) {
        return new Promise<Response>((resolve) => {
          resolveOldRecommendation = resolve;
        });
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    const venueSelect = await screen.findByRole('combobox', { name: /^venue$/i });
    await user.selectOptions(venueSelect, 'venue-1');
    await user.click(screen.getByRole('button', { name: /find best seats/i }));
    await user.selectOptions(venueSelect, 'venue-2');
    expect(await screen.findByRole('img', { name: /seat a1 booked/i })).toBeInTheDocument();

    await act(async () => {
      resolveOldDetail({
        ok: true,
        json: async () => ({
          id: 'venue-1',
          name: 'Main Hall',
          layout: { rows: 1, columns: 1 },
          seats: [{ id: 'a1', row: 'a', column: 1, status: 'AVAILABLE' }],
        }),
      } as Response);
      resolveOldRecommendation({
        ok: true,
        json: async () => ({
          row: 'a',
          seats: [{ id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' }],
        }),
      } as Response);
    });

    await waitFor(() => expect(screen.getByRole('img', { name: /seat a1 booked/i })).toBeInTheDocument());
    expect(screen.queryByText(/^A2, A3$/)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /seat a2 available/i })).not.toHaveClass('seat-recommended');
    expect(screen.getByRole('img', { name: /seat a5 available/i })).not.toHaveClass('seat-recommended');
    expect(screen.queryByRole('img', { name: /seat a1 available/i })).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a booking is in flight', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let resolveBooking: (response: Response) => void = () => {};
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/bookings') && init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveBooking = resolve;
        });
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    await screen.findByText(/a2, a3/i);
    const bookButton = screen.getByRole('button', { name: /book these seats/i });
    await user.click(bookButton);

    expect(bookButton).toBeDisabled();
    await user.click(bookButton);
    expect(mockFetch.mock.calls.filter(([url, init]) => String(url).endsWith('/api/bookings') && init?.method === 'POST')).toHaveLength(1);

    resolveBooking({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'booking-1',
        venueId: 'venue-1',
        partySize: 2,
        seats: [{ seat: { id: 'a2' } }, { seat: { id: 'a3' } }],
      }),
    } as Response);
    expect(await screen.findByRole('dialog', { name: /booking confirmed/i })).toBeInTheDocument();
  });

  it('keeps booking confirmation when refreshing the venue fails', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let detailRequests = 0;
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/venues/venue-1') && !init?.method) {
        detailRequests += 1;
        if (detailRequests > 1) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'Database is unavailable' } }),
          } as Response);
        }
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    await screen.findByText(/a2, a3/i);
    await user.click(screen.getByRole('button', { name: /book these seats/i }));

    expect(await screen.findByRole('dialog', { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/booking was confirmed, but the venue could not be refreshed/i)).toBeInTheDocument();
    expect(screen.queryByText(/^booking failed/i)).not.toBeInTheDocument();
  });

  it('opens venue management controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /manage venue/i }));

    expect(screen.getByRole('dialog', { name: /manage venue/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /manage venue/i })).toHaveAccessibleName('Manage Venue');
    expect(screen.getByLabelText(/venue name/i)).toHaveAttribute('maxLength', '30');
    expect(screen.getByRole('spinbutton', { name: /rows/i })).toHaveAttribute('max', '50');
    expect(screen.getByRole('spinbutton', { name: /columns/i })).toHaveAttribute('max', '1000');
    expect(screen.getByRole('button', { name: /add venue/i })).toBeInTheDocument();
    const deleteVenueSelect = screen.getByRole('combobox', { name: /venue to delete/i });
    expect(deleteVenueSelect).toHaveValue('');
    expect(within(deleteVenueSelect).getByRole('option', { name: 'Main Hall' })).toBeInTheDocument();
    expect(within(deleteVenueSelect).getByRole('option', { name: 'Balcony' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete venue$/i })).toBeDisabled();
    expect(screen.queryByLabelText(/admin token/i)).not.toBeInTheDocument();

    const venueNameInput = screen.getByLabelText(/venue name/i);
    await user.type(venueNameInput, 'v'.repeat(35));
    expect(venueNameInput).toHaveValue('v'.repeat(30));
    await user.clear(screen.getByRole('spinbutton', { name: /rows/i }));
    await user.type(screen.getByRole('spinbutton', { name: /rows/i }), '23');
    await user.selectOptions(deleteVenueSelect, 'venue-2');
    await user.click(screen.getByRole('button', { name: /close manage venue dialog/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /manage venue/i })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /manage venue/i }));
    expect(screen.getByLabelText(/venue name/i)).toHaveValue('');
    expect(screen.getByRole('spinbutton', { name: /rows/i })).toHaveValue(10);
    expect(screen.getByRole('spinbutton', { name: /columns/i })).toHaveValue(12);
    expect(screen.getByRole('combobox', { name: /venue to delete/i })).toHaveValue('');
  });

  it('shows a no venues state with a Create Venue action that opens the modal', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/venues') && !init?.method) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /no venues yet/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manage venue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /^venue$/i })).not.toBeInTheDocument();
    expect(screen.queryByText('No venue to display yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Select a venue to view the seat map.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /best available seats/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no seat recommendation yet/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /create venue/i }));

    expect(screen.getByRole('dialog', { name: /manage venue/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /delete venue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete venue$/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/venue name/i)).toHaveFocus();
  });

  it('adds a venue without asking for an admin token and closes after confirmation', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    const createdVenue = { id: 'venue-2', name: 'New Venue', rows: 10, columns: 12 };
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 201, json: async () => createdVenue } as Response);
      }
      if (url.includes('/api/venues/venue-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: createdVenue.id,
            name: createdVenue.name,
            layout: { rows: createdVenue.rows, columns: createdVenue.columns },
            seats: [],
          }),
        } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /manage venue/i }));
    await user.type(screen.getByLabelText(/venue name/i), 'New Venue');
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(await screen.findByText(/new venue was added with 120 seats/i)).toBeInTheDocument();
    const manager = screen.getByRole('dialog', { name: /manage venue/i });
    const addVenueForm = within(manager).getByRole('button', { name: /add venue/i }).closest('form');
    expect(addVenueForm).not.toBeNull();
    expect(within(addVenueForm as HTMLFormElement).getByRole('status')).toHaveTextContent(/new venue was added with 120 seats/i);
    expect(within(addVenueForm as HTMLFormElement).getByLabelText(/venue name/i)).toHaveValue('');
    expect(within(addVenueForm as HTMLFormElement).getByRole('spinbutton', { name: /rows/i })).toHaveValue(10);
    expect(within(addVenueForm as HTMLFormElement).getByRole('spinbutton', { name: /columns/i })).toHaveValue(12);
    const deletePanel = within(manager).getByRole('region', { name: /delete venue/i });
    expect(within(deletePanel).queryByRole('status')).not.toBeInTheDocument();
    const createRequest = mockFetch.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/venues') && init?.method === 'POST',
    );
    expect(createRequest?.[1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(createRequest?.[1]?.headers).not.toHaveProperty('x-admin-token');
    await waitFor(
      () => expect(screen.queryByRole('dialog', { name: /manage venue/i })).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
    expect(screen.getByRole('status')).toHaveTextContent(/new venue was added with 120 seats/i);
    await user.click(screen.getByRole('button', { name: /dismiss venue notification/i }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('blocks adding a venue whose name already exists, ignoring case and surrounding spaces', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /manage venue/i }));
    await user.type(screen.getByLabelText(/venue name/i), '  main hall  ');

    expect(screen.getByRole('alert')).toHaveTextContent(/venue with this name already exists/i);
    expect(screen.getByRole('button', { name: /add venue/i })).toBeDisabled();
    expect(mockFetch.mock.calls.some(([url, init]) => String(url).endsWith('/api/venues') && init?.method === 'POST')).toBe(false);
  });

  it('automatically hides the venue success notice after 10 seconds', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/venues') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 'venue-3', name: 'New Venue', rows: 10, columns: 12 }),
        } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /manage venue/i }));
    await user.type(screen.getByLabelText(/venue name/i), 'New Venue');
    const timeoutSpy = vi.spyOn(window, 'setTimeout');
    await user.click(screen.getByRole('button', { name: /add venue/i }));
    expect(await screen.findByText(/new venue was added with 120 seats/i)).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByRole('dialog', { name: /manage venue/i })).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
    expect(screen.getByRole('status')).toHaveTextContent(/new venue was added with 120 seats/i);

    const hideNotice = timeoutSpy.mock.calls.find(([, delay]) => delay === 10_000)?.[0];
    expect(hideNotice).toBeDefined();
    act(() => (hideNotice as () => void)());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the Manage Venue button', async () => {
    const user = userEvent.setup();
    render(<App />);

    const manageButton = await screen.findByRole('button', { name: /manage venue/i });
    await user.click(manageButton);
    expect(screen.getByRole('dialog', { name: /manage venue/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(
      () => expect(screen.queryByRole('dialog', { name: /manage venue/i })).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
    expect(manageButton).toHaveFocus();
  });

  it('deletes the venue selected in the manager without changing the main selection', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let venueWasDeleted = false;
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues/venue-2') && init?.method === 'DELETE') {
        venueWasDeleted = true;
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      if (url.endsWith('/api/venues') && !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => venueWasDeleted
            ? [{ id: 'venue-1', name: 'Main Hall', rows: 2, columns: 5 }]
            : [
                { id: 'venue-1', name: 'Main Hall', rows: 2, columns: 5 },
                { id: 'venue-2', name: 'Balcony', rows: 2, columns: 5 },
              ],
        } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /^venue$/i }), 'venue-1');
    await user.click(await screen.findByRole('button', { name: /manage venue/i }));
    const deleteVenueSelect = screen.getByRole('combobox', { name: /venue to delete/i });
    expect(deleteVenueSelect).toHaveValue('');
    await user.selectOptions(deleteVenueSelect, 'venue-2');
    await user.click(screen.getByRole('button', { name: /^delete venue$/i }));

    expect(screen.getByRole('group', { name: /confirm venue deletion/i })).toHaveTextContent('Confirm?');
    expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();
    expect(mockFetch.mock.calls.some(([url, init]) => String(url).endsWith('/api/venues/venue-2') && init?.method === 'DELETE')).toBe(false);
    await user.click(screen.getByRole('button', { name: /^confirm$/i }));
    expect(await screen.findByText(/balcony and its seats and bookings were deleted/i)).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByRole('dialog', { name: /manage venue/i })).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
    expect(screen.getByRole('combobox', { name: /^venue$/i })).toHaveValue('venue-1');
  });
});
