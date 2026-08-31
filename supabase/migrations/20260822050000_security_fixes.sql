-- Migration: Security Fixes for SEC-01 and SEC-03
-- File: supabase/migrations/20260822050000_security_fixes.sql
-- Date: 2026-08-22

-- =============================================================================
-- FIX SEC-01: RLS Privilege Escalation on Assignments
-- =============================================================================
-- The UPDATE policy on public.assignments allows any user who owns a row
-- (auth.uid() = user_id) to update ALL columns, including admin-only fields
-- like is_verified, review_status, verified_by, and verified_at.
-- This BEFORE UPDATE trigger prevents non-admin users from altering those fields.

CREATE OR REPLACE FUNCTION public.enforce_assignment_student_write_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Admins bypass all restrictions
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Block students from modifying verification fields
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update verification status.';
    END IF;

    IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update review status.';
    END IF;

    IF NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update the verifier.';
    END IF;

    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update verification timestamp.';
    END IF;

    -- Block students from modifying mentor feedback
    IF NEW.mentor_feedback IS DISTINCT FROM OLD.mentor_feedback THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update mentor feedback.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enforce_assignment_student_write_limits ON public.assignments;
CREATE TRIGGER tr_enforce_assignment_student_write_limits
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_assignment_student_write_limits();


-- =============================================================================
-- FIX SEC-03: Unrestricted Notification Injection
-- =============================================================================
-- The existing INSERT policy uses WITH CHECK (true), allowing any authenticated
-- user to insert notifications targeting arbitrary user_ids — enabling spoofed
-- system alerts, fake live class invitations, or admin inbox spam.
--
-- Fix: restrict client-side INSERT to admins only. Database triggers (which run
-- as SECURITY DEFINER) bypass RLS entirely, so trigger-generated notifications
-- for assignment creation, completion, and review actions are unaffected.

DROP POLICY IF EXISTS "Allow trigger or admin to insert notifications" ON public.notifications;

CREATE POLICY "Only admins can insert notifications from client"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin());
