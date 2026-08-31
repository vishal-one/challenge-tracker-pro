/**
 * Tests for CodeWorkspace component — Monaco editor lifecycle, submission UX, and cleanup.
 * Validates editor disposal (PERF-02) and the AI review loading state transition.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mock Monaco Editor ──────────────────────────────────────────────────
const mockDispose = vi.fn();
const mockGetValue = vi.fn(() => 'console.log("test");');
let capturedOnMount: ((editor: any) => void) | null = null;

vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedOnMount = props.onMount;
    return React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor Mock');
  },
}));

// ── Mock Supabase — use inline factory to avoid hoisting issues ──────────
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { output: 'Hello World' },
        error: null,
      }),
    },
  },
}));

import { CodeWorkspace } from '../components/workspace/CodeWorkspace';

describe('CodeWorkspace — Editor Lifecycle & Submission UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnMount = null;
  });

  it('renders the Monaco editor mock and toolbar buttons', () => {
    render(<CodeWorkspace assignmentId="test-123" />);

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.getByText('Run Code')).toBeInTheDocument();
    expect(screen.getByText('Save & Submit Code')).toBeInTheDocument();
  });

  it('calls editorRef.current.dispose() on unmount to prevent memory leaks (PERF-02)', async () => {
    const { unmount } = render(<CodeWorkspace assignmentId="test-123" />);

    // Simulate Monaco calling onMount with a mock editor instance
    if (capturedOnMount) {
      capturedOnMount({ dispose: mockDispose, getValue: mockGetValue });
    }

    unmount();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('transitions button text to "AI is reviewing your code..." during submission', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; })
    );

    render(<CodeWorkspace assignmentId="test-123" onSubmit={onSubmit} />);

    // Simulate Monaco mounting with getValue
    if (capturedOnMount) {
      capturedOnMount({ dispose: mockDispose, getValue: mockGetValue });
    }

    // Click submit
    fireEvent.click(screen.getByText('Save & Submit Code'));

    // While awaiting, the button should show loading text and spinner
    await waitFor(() => {
      expect(screen.getByText('AI is reviewing your code...')).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(b => b.hasAttribute('disabled') && b.className.includes('bg-violet'));
      expect(submitButton).toBeTruthy();
      expect(submitButton!.querySelector('.animate-spin')).toBeTruthy();
    });

    // Resolve the submission
    resolveSubmit();

    // After resolving, it should revert to the original text
    await waitFor(() => {
      expect(screen.getByText('Save & Submit Code')).toBeInTheDocument();
    });
  });

  it('shows error when trying to submit empty code', async () => {
    const emptyGetValue = vi.fn(() => '   ');
    render(<CodeWorkspace assignmentId="test-123" onSubmit={vi.fn()} />);

    // Mount with empty-returning editor
    if (capturedOnMount) {
      capturedOnMount({ dispose: mockDispose, getValue: emptyGetValue });
    }

    fireEvent.click(screen.getByText('Save & Submit Code'));

    await waitFor(() => {
      expect(screen.getByText(/Cannot submit empty code/)).toBeInTheDocument();
    });
  });
});
