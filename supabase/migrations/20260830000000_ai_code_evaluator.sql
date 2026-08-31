-- Migration: Add AI evaluation feedback and score to assignments
-- File: supabase/migrations/20260830000000_ai_code_evaluator.sql
-- Date: 2026-08-30

ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS ai_feedback TEXT,
ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100);
