-- Module 4: Subscription Payments & Payment Processing Trigger
-- Migration: 20260728180300_subscription_payments.sql

-- 1. Create subscription_payments ledger table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= (0)::numeric),
    plan_type TEXT NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.subscription_payments;
CREATE POLICY "Users can view own payments" ON public.subscription_payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.subscription_payments;
CREATE POLICY "Users can insert own payments" ON public.subscription_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Payment processing trigger function
CREATE OR REPLACE FUNCTION public.process_subscription_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- SCENARIO A: User Swipes Right (Paid) -> Log payment & shift date forward 1 cycle
    IF (NEW.subscription_status = 'paid') THEN
        INSERT INTO public.subscription_payments (
            user_id,
            subscription_id,
            service_name,
            amount,
            plan_type,
            payment_date
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.service_name,
            NEW.cost,
            NEW.plan_type,
            timezone('utc'::text, now())
        );

        NEW.next_due_date := CASE
            WHEN NEW.plan_type = 'Weekly'  THEN NEW.next_due_date + INTERVAL '1 week'
            WHEN NEW.plan_type = 'Monthly' THEN NEW.next_due_date + INTERVAL '1 month'
            WHEN NEW.plan_type = 'Annual'  THEN NEW.next_due_date + INTERVAL '1 year'
            ELSE NEW.next_due_date
        END;
        -- Reset status back to unpaid for the new upcoming period
        NEW.subscription_status := 'unpaid';
        NEW.updated_at := timezone('utc'::text, now());
    -- SCENARIO B: Catch-all state modifier for rows passing their due date
    ELSIF (NEW.next_due_date < current_date AND NEW.subscription_status = 'unpaid') THEN
        NEW.subscription_status := 'overdue';
    END IF;
    RETURN NEW;
END;
$function$;

-- 5. Trigger on public.subscriptions BEFORE UPDATE
DROP TRIGGER IF EXISTS trg_process_subscription_payment ON public.subscriptions;
CREATE TRIGGER trg_process_subscription_payment
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.process_subscription_payment();

-- 6. Backfill initial payment records for existing active subscriptions
INSERT INTO public.subscription_payments (
    user_id,
    subscription_id,
    service_name,
    amount,
    plan_type,
    payment_date
)
SELECT 
    s.user_id,
    s.id,
    s.service_name,
    s.cost,
    s.plan_type,
    s.created_at
FROM public.subscriptions s
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscription_payments sp WHERE sp.subscription_id = s.id
);
