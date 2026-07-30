-- Migration: 20260730221600_add_category_to_subscriptions.sql
-- Add category column to subscriptions table with default 'Other'

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';

CREATE INDEX IF NOT EXISTS idx_subscriptions_category 
ON public.subscriptions (category);
