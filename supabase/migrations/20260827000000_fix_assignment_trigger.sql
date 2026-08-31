-- Migration: Fix enforce_assignment_student_write_limits() trigger function
-- File: supabase/migrations/20260827000000_fix_assignment_trigger.sql
-- Date: 2026-08-27
--
-- The original SEC-01 trigger referenced columns (is_verified, verified_by,
-- verified_at) that do not exist on the assignments table, causing:
--   ERROR: record "new" has no field "is_verified"
--
-- This migration replaces the function to only guard the columns that
-- actually exist: review_status and mentor_feedback.

CREATE OR REPLACE FUNCTION public.enforce_assignment_student_write_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Admins bypass all restrictions
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Block students from modifying review status
    IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update review status.';
    END IF;

    -- Block students from modifying mentor feedback
    IF NEW.mentor_feedback IS DISTINCT FROM OLD.mentor_feedback THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update mentor feedback.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
