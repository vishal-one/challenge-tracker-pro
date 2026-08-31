/**
 * Tests for useNotifications hook — Realtime subscriptions & TanStack Query cache invalidation.
 * Validates fixes from Steps 43-45 (channel naming, subscription chaining, Strict Mode).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the hook
vi.mock('../lib/supabase', () => {
  const mockChannelOn = vi.fn().mockReturnThis();
  const mockChannelSubscribe = vi.fn().mockReturnThis();

  return {
    supabase: {
      from: vi.fn(() => {
        const builder: Record<string, any> = {};
        const methods = ['select', 'eq', 'order', 'update', 'single'];
        for (const m of methods) builder[m] = vi.fn().mockReturnValue(builder);
        builder.then = vi.fn((resolve: any) => resolve({ data: [], error: null }));
        return builder;
      }),
      channel: vi.fn(() => ({
        on: mockChannelOn,
        subscribe: mockChannelSubscribe,
        unsubscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', display_name: 'Test User', role: 'user' },
  })),
}));

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useNotifications — Realtime Subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Supabase Realtime channel on mount', () => {
    renderHook(() => useNotifications(), { wrapper: createWrapper() });

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = (supabase.channel as any).mock.calls[0][0] as string;
    expect(channelName).toMatch(/^notifs-user-123-\d+$/);
  });

  it('appends a timestamp to the channel name for React 18 Strict Mode uniqueness (Step 45)', () => {
    const before = Date.now();
    renderHook(() => useNotifications(), { wrapper: createWrapper() });
    const after = Date.now();

    const channelName = (supabase.channel as any).mock.calls[0][0] as string;
    const timestampPart = parseInt(channelName.split('-').pop()!, 10);

    expect(timestampPart).toBeGreaterThanOrEqual(before);
    expect(timestampPart).toBeLessThanOrEqual(after);
  });

  it('subscribes to postgres_changes on the notifications table with correct filter', () => {
    renderHook(() => useNotifications(), { wrapper: createWrapper() });

    const channelMock = (supabase.channel as any).mock.results[0].value;
    expect(channelMock.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.user-123',
      }),
      expect.any(Function)
    );
    expect(channelMock.subscribe).toHaveBeenCalledTimes(1);
  });

  it('calls supabase.removeChannel on unmount for cleanup', () => {
    const { unmount } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
  });

  it('triggers queryClient.invalidateQueries when a realtime payload is received', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useNotifications(), { wrapper });

    // Extract the callback passed to .on()
    const channelMock = (supabase.channel as any).mock.results[0].value;
    const onCallback = channelMock.on.mock.calls[0][2];

    // Simulate receiving a Realtime payload
    act(() => {
      onCallback({ new: { id: 'notif-1', message: 'Test' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });
});
