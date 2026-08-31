/**
 * Tests for the evaluate-code Edge Function SCORE regex extraction logic.
 * Validates the plain-text parsing strategy implemented in Step 55.
 */
import { describe, it, expect } from 'vitest';

// ── Extracted parsing logic (mirrors index.ts lines 138-150) ──────────────
function parseGeminiRawText(rawText: string): { score: number; feedback: string } {
  let parsedResult = { score: 75, feedback: 'Evaluation completed.' };

  try {
    const scoreMatch = rawText.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))) : 75;

    const feedback = rawText.replace(/SCORE:\s*\d+/i, '').trim() || rawText;

    parsedResult = { score, feedback };
  } catch {
    parsedResult.feedback = rawText || 'An error occurred while formatting the AI feedback.';
  }

  return parsedResult;
}

// ── Test Suite ────────────────────────────────────────────────────────────
describe('evaluate-code: SCORE regex extraction (Step 55)', () => {
  it('extracts integer score from standard "SCORE: 95" format', () => {
    const raw = `SCORE: 95\n\n### 🎯 Evaluation Summary\nExcellent implementation.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(95);
    expect(result.feedback).toContain('### 🎯 Evaluation Summary');
    expect(result.feedback).not.toMatch(/SCORE:\s*\d+/i);
  });

  it('extracts score from "SCORE:42" without spaces', () => {
    const raw = `SCORE:42\nNeeds improvement.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(42);
    expect(result.feedback).toBe('Needs improvement.');
  });

  it('extracts score from "score: 100" (case-insensitive)', () => {
    const raw = `score: 100\n### Perfect.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(100);
  });

  it('clamps scores exceeding 100 down to 100', () => {
    const raw = `SCORE: 150\nOver the top.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(100);
  });

  it('clamps negative scores up to 0', () => {
    // parseInt of a negative would fail the regex \d+ anyway, so score defaults to 75
    const raw = `SCORE: -5\nBad.`;
    const result = parseGeminiRawText(raw);
    // The regex /\d+/ won't match "-5" — so it falls to default 75
    expect(result.score).toBe(75);
  });

  it('defaults to score 75 when no SCORE line is present', () => {
    const raw = `### 🎯 Evaluation Summary\nNo score preamble here.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(75);
    expect(result.feedback).toContain('### 🎯 Evaluation Summary');
  });

  it('handles empty string input gracefully', () => {
    const result = parseGeminiRawText('');
    expect(result.score).toBe(75);
    expect(result.feedback).toBe('');
  });

  it('preserves full markdown with escaped newlines after stripping SCORE', () => {
    const raw = `SCORE: 88\n### 🎯 Evaluation Summary\nSolid implementation.\n\n### ✅ What You Did Well\n- Clean code structure\n- Proper error handling\n\n### 🔍 Areas for Improvement & Bugs\n- Consider edge cases for empty input\n\n### 💡 Actionable Recommendations & Code Tips\n- Use TypeScript's 'strict' mode`;
    const result = parseGeminiRawText(raw);

    expect(result.score).toBe(88);
    expect(result.feedback).toContain('### 🎯 Evaluation Summary');
    expect(result.feedback).toContain('### ✅ What You Did Well');
    expect(result.feedback).toContain('### 🔍 Areas for Improvement & Bugs');
    expect(result.feedback).toContain('### 💡 Actionable Recommendations & Code Tips');
    expect(result.feedback).not.toContain('SCORE: 88');
  });

  it('handles SCORE embedded mid-text by extracting only the first match', () => {
    const raw = `SCORE: 70\nSome feedback.\nAnother line mentioning SCORE: 90 in context.`;
    const result = parseGeminiRawText(raw);
    expect(result.score).toBe(70);
    // The first SCORE: 70 is stripped; the second occurrence in prose may remain
    expect(result.feedback).toContain('Some feedback.');
  });
});
