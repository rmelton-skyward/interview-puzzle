import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const mockFetch = vi.fn();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);

  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/venues') && !url.includes('/best-seats') && !url.includes('/api/venues/')) {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 'venue-1', name: 'Main Hall', rows: 2, columns: 5 }],
      } as Response);
    }

    if (url.includes('/api/venues/venue-1')) {
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
      return Promise.resolve({
        ok: true,
        json: async () => ({
          row: 'a',
          seats: [
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
    expect(await screen.findByText(/main hall/i)).toBeInTheDocument();

    const input = await screen.findByLabelText(/party size/i);
    await user.clear(input);
    await user.type(input, '2');
    await user.click(screen.getByRole('button', { name: /find best seats/i }));

    expect(await screen.findByText(/recommended seats are in/i)).toBeInTheDocument();
    expect(screen.getByText(/a2, a3/i)).toBeInTheDocument();
    const bestSeatsRequest = mockFetch.mock.calls.find(([url]) => String(url).includes('/best-seats'));
    expect(JSON.parse(String(bestSeatsRequest?.[1]?.body))).toMatchObject({ partySize: 12 });

    expect(screen.getByRole('button', { name: /seat a2 available/i })).toHaveClass('bg-\[\#efb84b\]');
    expect(screen.getByRole('button', { name: /seat a3 available/i })).toHaveClass('bg-\[\#efb84b\]');

    await user.click(screen.getByRole('button', { name: /book these seats/i }));

    expect(await screen.findByText(/booking confirmed for seats a2, a3/i)).toBeInTheDocument();
  });

  it('opens venue management controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /manage venues/i }));

    expect(screen.getByRole('dialog', { name: /manage venues/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /manage venues/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add venue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete main hall/i })).toBeInTheDocument();
  });

  it('sends JSON when adding a venue without an admin token', async () => {
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
    await user.click(await screen.findByRole('button', { name: /manage venues/i }));
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(await screen.findByText(/new venue was added with 120 seats/i)).toBeInTheDocument();
    const createRequest = mockFetch.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/venues') && init?.method === 'POST',
    );
    expect(createRequest?.[1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});
