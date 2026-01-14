-- Step 1: Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- Add theme_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'dark';