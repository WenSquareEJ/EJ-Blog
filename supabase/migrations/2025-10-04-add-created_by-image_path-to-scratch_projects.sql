-- Migration: Add created_by and image_path columns to scratch_projects
-- created_by: UUID, references auth.users.id (for owner-based delete)
-- image_path: text, stores Supabase Storage key for thumbnail

ALTER TABLE public.scratch_projects
ADD COLUMN created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.scratch_projects
ADD COLUMN image_path TEXT;
