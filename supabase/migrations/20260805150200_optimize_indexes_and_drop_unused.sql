-- Migration: 20260805150200_optimize_indexes_and_drop_unused.sql
-- Description: Safely drop unused indexes (idx_profiles_fcm_token, idx_subscriptions_category)
--              and replace single-column idx_subscription_payments_user_id with composite idx_sub_payments_user_date.

-- 1. Drop unused indexes that have zero query scans and are not backing FK constraints
DROP INDEX IF EXISTS public.idx_profiles_fcm_token;
DROP INDEX IF EXISTS public.idx_subscriptions_category;

-- 2. Replace single-column payment user_id index with composite (user_id, payment_date DESC)
--    Supercedes single-column index for home page payment queries:
--    .eq("user_id", ...).gte("payment_date", ...).order("payment_date", { ascending: false })
DROP INDEX IF EXISTS public.idx_subscription_payments_user_id;

CREATE INDEX IF NOT EXISTS idx_sub_payments_user_date
    ON public.subscription_payments USING btree (user_id, payment_date DESC);
