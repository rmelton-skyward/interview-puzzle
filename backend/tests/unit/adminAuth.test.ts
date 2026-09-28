import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadRequireAdmin(adminToken: string) {
  vi.resetModules();
  vi.stubEnv('ADMIN_TOKEN', adminToken);
  const { requireAdmin } = await import('../../src/middleware/adminAuth.js');
  return requireAdmin;
}

describe('requireAdmin', () => {
  it('allows local development when ADMIN_TOKEN is not configured', async () => {
    const requireAdmin = await loadRequireAdmin('');
    const next = vi.fn();

    requireAdmin({ header: () => undefined } as never, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an invalid admin token', async () => {
    const requireAdmin = await loadRequireAdmin('expected-token');
    const next = vi.fn();

    requireAdmin({ header: () => 'wrong-token' } as never, {} as never, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('accepts a bearer admin token', async () => {
    const requireAdmin = await loadRequireAdmin('expected-token');
    const next = vi.fn();

    requireAdmin({ header: (name: string) => name === 'authorization' ? 'Bearer expected-token' : undefined } as never, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });
});
