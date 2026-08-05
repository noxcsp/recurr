-- Migration: 20260805230000_get_due_notification_candidates_rpc.sql
-- Description: RPC function performing DB-side JOIN between subscriptions and profiles to fetch due, trial-ending, and overdue notifications without loading all profiles into edge function memory.

CREATE OR REPLACE FUNCTION public.get_due_notification_candidates(
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  service_name TEXT,
  cost NUMERIC,
  plan_type TEXT,
  next_due_date DATE,
  is_trial BOOLEAN,
  trial_end_date DATE,
  subscription_status public.status,
  fcm_token TEXT,
  notify_advance_days INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.service_name,
    s.cost,
    s.plan_type,
    s.next_due_date,
    s.is_trial,
    s.trial_end_date,
    s.subscription_status,
    p.fcm_token,
    COALESCE(p.notify_advance_days, 3) AS notify_advance_days
  FROM public.subscriptions s
  JOIN public.profiles p ON s.user_id = p.id
  WHERE 
    s.subscription_status <> 'cancelled'
    AND (
      -- Condition A: Trial Ending on (target_date + notify_advance_days)
      (s.is_trial = true AND s.trial_end_date = target_date + COALESCE(p.notify_advance_days, 3))
      OR
      -- Condition B: Next Due Date on (target_date + notify_advance_days)
      (s.next_due_date = target_date + COALESCE(p.notify_advance_days, 3))
      OR
      -- Condition C: Overdue (next_due_date before target_date, status unpaid or overdue)
      ((s.subscription_status = 'overdue' OR s.subscription_status = 'unpaid') AND s.next_due_date < target_date)
    );
$$;

-- Revoke execute from public roles and grant to service_role and postgres only
REVOKE EXECUTE ON FUNCTION public.get_due_notification_candidates(DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_due_notification_candidates(DATE) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_notification_candidates(DATE) TO service_role, postgres;

COMMENT ON FUNCTION public.get_due_notification_candidates(DATE) IS 'Fetches candidate subscriptions joined with user profile settings for push and in-app notifications on target_date';
