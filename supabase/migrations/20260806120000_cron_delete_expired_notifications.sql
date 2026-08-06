-- Migration: 20260806120000_cron_delete_expired_notifications.sql
-- Add daily pg_cron job to delete notifications older than notification_ttl_days per profile

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Create SECURITY DEFINER function to purge expired notifications
CREATE OR REPLACE FUNCTION public.delete_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Delete notifications exceeding their user profile's notification_ttl_days
    DELETE FROM public.notifications n
    USING public.profiles p
    WHERE n.user_id = p.id
      AND n.created_at < (now() - (COALESCE(p.notification_ttl_days, 3) * INTERVAL '1 day'));

    -- Clean up any orphan notifications older than default TTL (3 days)
    DELETE FROM public.notifications n
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = n.user_id
    )
    AND n.created_at < (now() - INTERVAL '3 days');
END;
$$;

-- 2. Revoke public execution on SECURITY DEFINER helper function
REVOKE EXECUTE ON FUNCTION public.delete_expired_notifications() FROM public, anon, authenticated;

-- 3. Schedule daily pg_cron job at 01:00 UTC
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-notifications') THEN
        PERFORM cron.unschedule('delete-expired-notifications');
    END IF;
END $$;

SELECT cron.schedule(
    'delete-expired-notifications',
    '0 1 * * *',
    $$SELECT public.delete_expired_notifications();$$
);
