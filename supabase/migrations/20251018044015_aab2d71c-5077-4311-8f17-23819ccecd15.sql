-- Add new columns to profiles table for additional user information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS team_name text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'User contact phone number';
COMMENT ON COLUMN public.profiles.location IS 'User or organization location';
COMMENT ON COLUMN public.profiles.team_name IS 'Team name for community leaders';