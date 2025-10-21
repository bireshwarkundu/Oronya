-- Create user roles enum and table
CREATE TYPE public.user_role AS ENUM ('user', 'government_admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Only admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role = 'government_admin'
));

-- Add verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verified_by TEXT,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_notes TEXT,
ADD COLUMN qr_code_data TEXT;

-- Create verification history table
CREATE TABLE public.verification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  verification_status BOOLEAN NOT NULL,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on verification_history
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- Create policies for verification_history
CREATE POLICY "Users can view their verification history" 
ON public.verification_history 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all verification history" 
ON public.verification_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role = 'government_admin'
));

CREATE POLICY "Admins can insert verification records" 
ON public.verification_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role = 'government_admin'
));

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_government_admin(_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'government_admin'
  );
$$;

-- Insert a default admin user (you can change this email to your test admin)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('admin@government.com', 'government_admin');

-- Function to generate QR code data for user
CREATE OR REPLACE FUNCTION public.generate_qr_data_for_user(_user_id TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CONCAT('VERIFY_USER:', _user_id, ':', custom_user_id)
  FROM public.profiles 
  WHERE user_id = _user_id;
$$;