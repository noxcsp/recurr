-- Module 2: Subscriptions Core Module
-- Migration: 20260728180100_subscriptions.sql

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    cost NUMERIC NOT NULL CHECK (cost >= (0)::numeric),
    plan_type TEXT NOT NULL CHECK (plan_type = ANY (ARRAY['Weekly'::text, 'Monthly'::text, 'Annual'::text])),
    payment_mode TEXT NOT NULL,
    next_due_date DATE NOT NULL,
    is_trial BOOLEAN NOT NULL DEFAULT false,
    trial_end_date DATE,
    subscription_status public.status NOT NULL DEFAULT 'unpaid'::public.status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
    ON public.subscriptions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date 
    ON public.subscriptions USING btree (next_due_date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_due_status 
    ON public.subscriptions USING btree (next_due_date, subscription_status);

-- 3. Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);
