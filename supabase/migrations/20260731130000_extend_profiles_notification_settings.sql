-- Migration: 20260731130000_extend_profiles_notification_settings.sql
-- Extend profiles table with notification preference settings

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_advance_days INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS notification_ttl_days INTEGER NOT NULL DEFAULT 3;

-- Set default value to 3 and update existing rows
ALTER TABLE public.profiles ALTER COLUMN notification_ttl_days SET DEFAULT 3;
UPDATE public.profiles SET notification_ttl_days = 3;

COMMENT ON COLUMN public.profiles.notify_advance_days IS 'Number of days in advance to notify user of upcoming subscription renewal';
COMMENT ON COLUMN public.profiles.notification_ttl_days IS 'Time to live in days for stored notifications before expiration (default 3 days)';
