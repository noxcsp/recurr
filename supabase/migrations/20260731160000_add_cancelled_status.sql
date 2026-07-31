-- Migration: 20260731160000_add_cancelled_status.sql
-- Add 'cancelled' to status enum type

ALTER TYPE public.status ADD VALUE IF NOT EXISTS 'cancelled';
