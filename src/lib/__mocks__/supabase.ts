/**
 * Comprehensive Supabase Client Mock for Vitest
 * Intercepts all database, edge function, auth, and realtime calls.
 */
import { vi } from 'vitest';

// ── Chainable query builder mock ──────────────────────────────────────────
const createQueryBuilder = () => {
  const builder: Record<string, any> = {};
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'lt', 'gte', 'lte',
    'like', 'ilike', 'is', 'in', 'not',
    'filter', 'match', 'or', 'and',
    'order', 'limit', 'range',
    'single', 'maybeSingle',
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal — resolves with empty data by default
  builder.then = vi.fn((resolve: any) =>
    resolve({ data: [], error: null, count: 0 })
  );

  return builder;
};

// ── Realtime channel mock ─────────────────────────────────────────────────
export const mockChannelOn = vi.fn().mockReturnThis();
export const mockChannelSubscribe = vi.fn().mockReturnThis();
export const mockChannelUnsubscribe = vi.fn();

const createChannelMock = () => ({
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
  unsubscribe: mockChannelUnsubscribe,
});

// ── Functions mock ────────────────────────────────────────────────────────
export const mockFunctionsInvoke = vi.fn().mockResolvedValue({
  data: { output: 'Hello, World!' },
  error: null,
});

// ── Auth mock ─────────────────────────────────────────────────────────────
export const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: null },
  error: null,
});

export const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});

// ── Assembled Supabase client mock ────────────────────────────────────────
export const supabase = {
  from: vi.fn(() => createQueryBuilder()),
  channel: vi.fn(() => createChannelMock()),
  removeChannel: vi.fn(),
  functions: {
    invoke: mockFunctionsInvoke,
  },
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
};
