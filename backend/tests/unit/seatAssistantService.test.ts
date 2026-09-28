import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createCompletion, getBestSeats } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
  getBestSeats: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class FakeOpenAI {
    chat = { completions: { create: createCompletion } };
  },
}));

vi.mock('../../src/services/venueService.js', () => ({ getBestSeats }));

describe('seatAssistantService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    createCompletion.mockReset();
    getBestSeats.mockReset();
    getBestSeats.mockResolvedValue({
      row: 'a',
      seats: [{ id: 'seat-1', row: 'a', column: 2, status: 'AVAILABLE' }],
    });
  });

  it('extracts a party size with OpenAI and delegates seat selection to the deterministic algorithm', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: '{"partySize": 3}' } }],
    });

    const { findSeatsFromNaturalLanguage } = await import('../../src/services/seatAssistantService.js');
    const result = await findSeatsFromNaturalLanguage('venue-1', 'I need three seats together');

    expect(createCompletion).toHaveBeenCalledOnce();
    expect(getBestSeats).toHaveBeenCalledWith('venue-1', 3);
    expect(result.preferences).toEqual({ partySize: 3 });
    expect(result.seats[0].column).toBe(2);
  });

  it('rejects malformed model output', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'not-json' } }],
    });

    const { findSeatsFromNaturalLanguage } = await import('../../src/services/seatAssistantService.js');

    await expect(findSeatsFromNaturalLanguage('venue-1', 'three seats')).rejects.toThrow(
      'The AI provider returned an invalid response',
    );
    expect(getBestSeats).not.toHaveBeenCalled();
  });
});
