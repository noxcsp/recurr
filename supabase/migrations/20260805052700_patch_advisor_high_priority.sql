-- Patch: High-Priority Supabase Advisor Issues
-- Migration: 20260805052700_patch_advisor_high_priority.sql
-- Resolves: function_search_path_mutable, anon/authenticated_security_definer_function_executable,
--           extension_in_public, unindexed_foreign_keys

-- ============================================================================
-- S1/S2: Pin search_path on SECURITY DEFINER functions
-- ============================================================================

-- S1: Recreate handle_new_user() with immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, timezone)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'timezone'
  );
  RETURN new;
END;
$function$;

-- S2: Recreate process_subscription_payment() with immutable search_path
CREATE OR REPLACE FUNCTION public.process_subscription_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    base_date DATE;
    calculated_due_date DATE;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.subscription_status = 'paid') THEN
            INSERT INTO public.subscription_payments (
                user_id, subscription_id, service_name, amount, plan_type, payment_date
            ) VALUES (
                NEW.user_id, NEW.id, NEW.service_name, NEW.cost, NEW.plan_type, timezone('utc'::text, now())
            );

            base_date := COALESCE(NEW.next_due_date, OLD.trial_end_date, CURRENT_DATE);

            NEW.next_due_date := CASE
                WHEN NEW.plan_type = 'Weekly'  THEN base_date + INTERVAL '1 week'
                WHEN NEW.plan_type = 'Monthly' THEN base_date + INTERVAL '1 month'
                WHEN NEW.plan_type = 'Annual'  THEN base_date + INTERVAL '1 year'
                ELSE base_date
            END;
            NEW.subscription_status := 'unpaid';
            NEW.updated_at := timezone('utc'::text, now());
        ELSIF (NEW.next_due_date IS NOT NULL AND NEW.next_due_date < CURRENT_DATE AND NEW.subscription_status = 'unpaid') THEN
            NEW.subscription_status := 'overdue';
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        IF (NEW.subscription_status = 'paid') THEN
            INSERT INTO public.subscription_payments (
                user_id, subscription_id, service_name, amount, plan_type, payment_date
            ) VALUES (
                NEW.user_id, NEW.id, NEW.service_name, NEW.cost, NEW.plan_type, timezone('utc'::text, now())
            );

            base_date := COALESCE(NEW.next_due_date, NEW.trial_end_date, CURRENT_DATE);

            calculated_due_date := CASE
                WHEN NEW.plan_type = 'Weekly'  THEN base_date + INTERVAL '1 week'
                WHEN NEW.plan_type = 'Monthly' THEN base_date + INTERVAL '1 month'
                WHEN NEW.plan_type = 'Annual'  THEN base_date + INTERVAL '1 year'
                ELSE base_date
            END;

            UPDATE public.subscriptions
            SET next_due_date = calculated_due_date,
                subscription_status = 'unpaid',
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================================
-- S4-S7: Revoke EXECUTE on SECURITY DEFINER functions from public roles
-- These are trigger-only functions and must not be callable via PostgREST /rpc/
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_subscription_payment() FROM public, anon, authenticated;

-- ============================================================================
-- S3: Move pg_net extension from public schema to extensions schema
-- ============================================================================

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ============================================================================
-- P13-P15: Add missing indexes on unindexed foreign keys
-- ============================================================================

-- P13: notifications.subscription_id FK
CREATE INDEX IF NOT EXISTS idx_notifications_subscription_id
    ON public.notifications USING btree (subscription_id);

-- P14: subscription_payments.subscription_id FK
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id
    ON public.subscription_payments USING btree (subscription_id);

-- P15: subscription_payments.user_id FK
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id
    ON public.subscription_payments USING btree (user_id);

-- ============================================================================
-- P1-P12: Fix RLS initplan — wrap auth.uid() in (SELECT ...) subselect
-- Re-create all RLS policies across all 4 tables
-- ============================================================================

-- P1-P2: public.profiles (2 policies)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- P3-P6: public.subscriptions (4 policies)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- P7-P10: public.notifications (4 policies)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- P11-P12: public.subscription_payments (2 policies)
DROP POLICY IF EXISTS "Users can view own payments" ON public.subscription_payments;
CREATE POLICY "Users can view own payments" ON public.subscription_payments
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.subscription_payments;
CREATE POLICY "Users can insert own payments" ON public.subscription_payments
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
