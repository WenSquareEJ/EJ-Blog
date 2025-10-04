-- Migration: Add avatar_url column to public.profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
