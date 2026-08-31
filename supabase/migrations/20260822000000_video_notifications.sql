-- 1. Add fields to support actionable video notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system' NOT NULL,
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 2. Enable Realtime for the notifications table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications;
COMMIT;
