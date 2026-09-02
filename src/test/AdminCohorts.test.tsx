import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase tracking
const mockDelete = vi.fn();
const mockDeleteEq = vi.fn();
const mockDeleteSelect = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdateSelect = vi.fn();

let deleteResult: { data: any; error: any } = {
  data: [{ id: 'student-456' }],
  error: null,
};

let updateResult: { data: any; error: any } = {
  data: [{ id: 'student-456' }],
  error: null,
};

const mockStudentProfile = {
  id: 'student-456',
  display_name: 'Test Student',
  role: 'user',
  account_status: 'active',
  cohort_id: 'cohort-alpha',
  institution: 'Tech University',
  bio: 'Learning React and TypeScript',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// Helper to build a chainable query builder that resolves to the given profiles
function buildSelectChain(profiles: any[]) {
  const chain: Record<string, any> = {};
  chain.order = vi.fn().mockResolvedValue({ data: profiles, error: null });
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  return chain;
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        const selectChain = buildSelectChain([mockStudentProfile]);
        return {
          select: selectChain.select,
          delete: () => {
            mockDelete();
            return {
              eq: (...eqArgs: any[]) => {
                mockDeleteEq(...eqArgs);
                return {
                  select: () => {
                    mockDeleteSelect();
                    return Promise.resolve(deleteResult);
                  },
                };
              },
            };
          },
          update: (...updateArgs: any[]) => {
            mockUpdate(...updateArgs);
            return {
              eq: (...eqArgs: any[]) => {
                mockUpdateEq(...eqArgs);
                return {
                  select: () => {
                    mockUpdateSelect();
                    return Promise.resolve(updateResult);
                  },
                };
              },
            };
          },
        };
      }
      if (table === 'assignments') {
        const selectChain = buildSelectChain([]);
        return {
          select: selectChain.select,
        };
      }
      const fallback = buildSelectChain([]);
      return fallback;
    }),
  },
}));

import { AdminCohorts } from '../pages/admin/AdminCohorts';
import { useAdminCohorts } from '../hooks/useAssignments';
import { renderHook, act } from '@testing-library/react';

function createWrapper(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('AdminCohorts — "Remove from Cohort" Mutation & UI Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteResult = { data: [{ id: 'student-456' }], error: null };
    updateResult = { data: [{ id: 'student-456' }], error: null };
  });

  it('executes hard delete with .select() and invalidates cache when allowed by RLS', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAdminCohorts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    await act(async () => {
      await result.current.removeFromCohort.mutateAsync('student-456');
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'student-456');
    expect(mockDeleteSelect).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['cohort-members'],
      })
    );
  });

  it('falls back to soft-delete with .select() when hard delete affects 0 rows (RLS blocked)', async () => {
    deleteResult = { data: [], error: null }; // 0 rows affected by delete

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useAdminCohorts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    await act(async () => {
      await result.current.removeFromCohort.mutateAsync('student-456');
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        account_status: 'inactive',
        cohort_id: null,
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'student-456');
    expect(mockUpdateSelect).toHaveBeenCalled();
  });

  it('throws security policy error if soft-delete also affects 0 rows', async () => {
    deleteResult = { data: [], error: null };
    updateResult = { data: [], error: null }; // 0 rows affected by update

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useAdminCohorts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    await expect(result.current.removeFromCohort.mutateAsync('student-456')).rejects.toThrow(
      'Action blocked by database security policies (0 rows affected).'
    );
  });

  it('opens modal on student click and closes on successful removal', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    render(
      <QueryClientProvider client={queryClient}>
        <AdminCohorts />
      </QueryClientProvider>
    );

    // Verify student is displayed in directory
    const studentRow = await screen.findByText('Test Student');
    expect(studentRow).toBeInTheDocument();

    // Verify avatar fallback renders user initials with Soft Violet styling
    const fallbackInitials = await screen.findAllByText('TS');
    expect(fallbackInitials.length).toBeGreaterThan(0);
    expect(fallbackInitials[0]).toHaveClass('bg-[#211E26]');
    expect(fallbackInitials[0]).toHaveClass('text-[#A78BF9]');

    // Click student row to open modal
    fireEvent.click(studentRow);

    // Modal should now be open with "Remove from Cohort" button
    const removeBtn = await screen.findByRole('button', { name: /remove from cohort/i });
    expect(removeBtn).toBeInTheDocument();
    expect(removeBtn).not.toBeDisabled();

    // Click "Remove from Cohort"
    fireEvent.click(removeBtn);

    // Verify Supabase hard delete was triggered for the student id
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'student-456');
    });

    // Verify cache invalidation was triggered
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['cohort-members'],
      })
    );

    // Modal should automatically close
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /remove from cohort/i })).not.toBeInTheDocument();
    });
  });

  it('displays error toast in UI when removal is blocked by database security policies', async () => {
    deleteResult = { data: [], error: null };
    updateResult = { data: [], error: null };

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminCohorts />
      </QueryClientProvider>
    );

    const studentRow = await screen.findByText('Test Student');
    fireEvent.click(studentRow);

    const removeBtn = await screen.findByRole('button', { name: /remove from cohort/i });
    fireEvent.click(removeBtn);

    // Verify error toast appears with security policies message
    const errorToast = await screen.findByRole('alert');
    expect(errorToast).toBeInTheDocument();
    expect(screen.getByText(/Action blocked by database security policies \(0 rows affected\)\./i)).toBeInTheDocument();
  });
});
