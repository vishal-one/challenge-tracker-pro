-- Migration: Remove Assignment Completion Notification Trigger and Manual Review Workflow
-- File: supabase/migrations/20260826000000_remove_review_system.sql
-- Date: 2026-08-26

-- 1. Drop the assignment completion notification trigger
DROP TRIGGER IF EXISTS on_assignment_completed ON public.assignments;

-- 2. Drop the notification trigger function
DROP FUNCTION IF EXISTS public.notify_admin_on_submission();
