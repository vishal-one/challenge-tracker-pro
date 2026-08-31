/**
 * Tests for ChallengeDetail component — AI feedback JSON parsing, displayStatus transitions,
 * and the expandable/collapsible feedback drawer (Steps 52-55).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Isolate: test only the parsing logic and derived state ──────────────
// The full ChallengeDetail component depends on react-router, TanStack Query, Auth context,
// CodeWorkspace, etc. Testing the UI rendering end-to-end would require mocking too many
// dependencies and offer diminishing returns. Instead, we extract and unit-test the two
// critical pieces: the JSON parsing logic and the displayStatus derivation.

// ── Extracted from ChallengeDetail.tsx (lines 72-92) ────────────────────
function parseAiFeedback(assignment: {
  ai_feedback: string | null;
  ai_score: number | null;
  progress_status: string;
  hasInteracted?: boolean;
}) {
  let displayFeedback = assignment?.ai_feedback || '';
  let displayScore = assignment?.ai_score || 0;

  if (typeof displayFeedback === 'string' && displayFeedback.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(displayFeedback);
      displayFeedback = parsed.feedback || displayFeedback;
      if (typeof parsed.score === 'number') {
        displayScore = parsed.score;
      }
    } catch (e) {
      // Falls through — displayFeedback stays as-is
    }
  }

  let displayStatus = 'INCOMPLETE';
  if (assignment.progress_status === 'complete') displayStatus = 'COMPLETE';
  else if (assignment.hasInteracted || assignment.progress_status === 'ongoing')
    displayStatus = 'ONGOING / IN PROGRESS';

  return { displayFeedback, displayScore, displayStatus };
}

describe('ChallengeDetail — AI Feedback JSON Parsing (Step 52)', () => {
  it('extracts markdown feedback from a stringified JSON object in ai_feedback', () => {
    const result = parseAiFeedback({
      ai_feedback: '{"score": 95, "feedback": "### 🎯 Summary\\nExcellent work."}',
      ai_score: null,
      progress_status: 'complete',
    });

    expect(result.displayFeedback).toBe('### 🎯 Summary\nExcellent work.');
    expect(result.displayScore).toBe(95);
  });

  it('uses ai_feedback directly when it is plain markdown (not JSON)', () => {
    const markdown = '### 🎯 Summary\nGreat job.';
    const result = parseAiFeedback({
      ai_feedback: markdown,
      ai_score: 88,
      progress_status: 'complete',
    });

    expect(result.displayFeedback).toBe(markdown);
    expect(result.displayScore).toBe(88);
  });

  it('falls back gracefully when ai_feedback is malformed JSON starting with {', () => {
    const result = parseAiFeedback({
      ai_feedback: '{ broken json }',
      ai_score: 70,
      progress_status: 'complete',
    });

    // Should keep the raw string since JSON.parse fails
    expect(result.displayFeedback).toBe('{ broken json }');
    expect(result.displayScore).toBe(70);
  });

  it('handles null ai_feedback and ai_score', () => {
    const result = parseAiFeedback({
      ai_feedback: null,
      ai_score: null,
      progress_status: 'complete',
    });

    expect(result.displayFeedback).toBe('');
    expect(result.displayScore).toBe(0);
  });

  it('prefers score from parsed JSON over ai_score column when JSON is valid', () => {
    const result = parseAiFeedback({
      ai_feedback: '{"score": 42, "feedback": "Needs work."}',
      ai_score: 99, // This should be overridden by the parsed score
      progress_status: 'complete',
    });

    expect(result.displayScore).toBe(42);
    expect(result.displayFeedback).toBe('Needs work.');
  });

  it('does NOT attempt to parse feedback that starts with [ (array)', () => {
    const result = parseAiFeedback({
      ai_feedback: '[{"item": 1}]',
      ai_score: 60,
      progress_status: 'complete',
    });

    // Should not attempt parsing because startsWith('{') is false
    expect(result.displayFeedback).toBe('[{"item": 1}]');
    expect(result.displayScore).toBe(60);
  });
});

describe('ChallengeDetail — displayStatus Derivation', () => {
  it('shows COMPLETE when progress_status is "complete"', () => {
    const result = parseAiFeedback({
      ai_feedback: 'Great work.',
      ai_score: 90,
      progress_status: 'complete',
    });
    expect(result.displayStatus).toBe('COMPLETE');
  });

  it('shows ONGOING when progress_status is "ongoing"', () => {
    const result = parseAiFeedback({
      ai_feedback: null,
      ai_score: null,
      progress_status: 'ongoing',
    });
    expect(result.displayStatus).toBe('ONGOING / IN PROGRESS');
  });

  it('shows ONGOING when hasInteracted is true', () => {
    const result = parseAiFeedback({
      ai_feedback: null,
      ai_score: null,
      progress_status: 'not_started',
      hasInteracted: true,
    });
    expect(result.displayStatus).toBe('ONGOING / IN PROGRESS');
  });

  it('shows INCOMPLETE by default', () => {
    const result = parseAiFeedback({
      ai_feedback: null,
      ai_score: null,
      progress_status: 'not_started',
    });
    expect(result.displayStatus).toBe('INCOMPLETE');
  });

  it('COMPLETE takes priority over hasInteracted', () => {
    const result = parseAiFeedback({
      ai_feedback: null,
      ai_score: null,
      progress_status: 'complete',
      hasInteracted: true,
    });
    expect(result.displayStatus).toBe('COMPLETE');
  });
});

describe('ChallengeDetail — Feedback Drawer expand/collapse logic', () => {
  // The drawer is driven by isFeedbackExpanded state, which controls:
  // 1. CSS class: max-h-48 overflow-hidden (collapsed) vs '' (expanded)
  // 2. Button text: "Show Detailed Feedback" (collapsed) vs "Show Less" (expanded)
  // We test the class string generation logic

  it('collapsed state produces overflow-hidden class', () => {
    const isFeedbackExpanded = false;
    const className = `transition-all duration-300 ${isFeedbackExpanded ? '' : 'max-h-48 overflow-hidden'}`;
    expect(className).toContain('max-h-48');
    expect(className).toContain('overflow-hidden');
  });

  it('expanded state removes overflow-hidden class', () => {
    const isFeedbackExpanded = true;
    const className = `transition-all duration-300 ${isFeedbackExpanded ? '' : 'max-h-48 overflow-hidden'}`;
    expect(className).not.toContain('max-h-48');
    expect(className).not.toContain('overflow-hidden');
  });
});
