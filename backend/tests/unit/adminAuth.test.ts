import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '../../src/middleware/adminAuth.js';

const originalAdminToken = process.env.ADMIN_TOKEN;

afterEach(() => {
  if (originalAdminToken === undefined) {
    delete process.env.ADMIN_TOKEN;
  } else {
    process.env.ADMIN_TOKEN = originalAdminToken;
  }
});

describe('requireAdmin', () => {
  it('allows local development when ADMIN_TOKEN is not configured', () => {
    delete process.env.ADMIN_TOKEN;
    const next = vi.fn();

    requireAdmin({ header: () => undefined } as never, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an invalid admin token', () => {
    process.env.ADMIN_TOKEN = 'expected-token';
    const next = vi.fn();

    requireAdmin({ header: () => 'wrong-token' } as never, {} as never, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('accepts a bearer admin token', () => {
    process.env.ADMIN_TOKEN = 'expected-token';
    const next = vi.fn();

    requireAdmin({ header: (name: string) => name === 'authorization' ? 'Bearer expected-token' : undefined } as never, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });
});
