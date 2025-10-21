-- Enable real-time updates for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add profiles table to realtime publication  
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.profiles;