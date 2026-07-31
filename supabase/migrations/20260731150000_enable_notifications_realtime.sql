-- Module 3 Extension: Enable Realtime publication & full replica identity for notifications
-- Migration: 20260731150000_enable_notifications_realtime.sql

-- 1. Enable Realtime CDC publication for public.notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Enable REPLICA IDENTITY FULL so DELETE event payloads contain all columns (including user_id for RLS/filter matching)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
