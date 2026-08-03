-- Migration: 20260731170000_make_next_due_date_nullable.sql
-- Allow next_due_date to be NULL when a free trial is active

ALTER TABLE public.subscriptions ALTER COLUMN next_due_date DROP NOT NULL;

-- Update payment processing trigger function to safely calculate next_due_date when transitioning from trial or null state
CREATE OR REPLACE FUNCTION public.process_subscription_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
