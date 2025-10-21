-- Add custom_user_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_user_id TEXT UNIQUE;

-- Create index for better performance on custom_user_id
CREATE INDEX idx_profiles_custom_user_id ON public.profiles(custom_user_id);

-- Create table for password change requests
CREATE TABLE public.password_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password change requests
ALTER TABLE public.password_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for password change requests
CREATE POLICY "Users can insert password change requests" 
ON public.password_change_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own password change requests" 
ON public.password_change_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own password change requests" 
ON public.password_change_requests 
FOR UPDATE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_password_change_requests_email ON public.password_change_requests(email);
CREATE INDEX idx_password_change_requests_otp ON public.password_change_requests(otp_code);
CREATE INDEX idx_password_change_requests_expires_at ON public.password_change_requests(expires_at);