-- Add government_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS government_id text;