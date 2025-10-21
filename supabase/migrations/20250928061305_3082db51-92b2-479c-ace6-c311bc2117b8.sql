-- Update user roles enum to include all admin types
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('user', 'user_admin', 'company_admin', 'government_admin');

-- Drop existing table and recreate with updated enum
DROP TABLE IF EXISTS public.user_roles CASCADE;

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

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role IN ('user_admin', 'company_admin', 'government_admin')
));

-- Add admin management fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS managed_by TEXT;

-- Create admin activity log table
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  admin_role user_role NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_activity_log
CREATE POLICY "Admins can view relevant activity logs" 
ON public.admin_activity_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role IN ('user_admin', 'company_admin', 'government_admin')
));

CREATE POLICY "Admins can insert activity logs" 
ON public.admin_activity_log 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()::text 
  AND ur.role IN ('user_admin', 'company_admin', 'government_admin')
));

-- Function to check admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id TEXT, _role user_role)
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
    AND role = _role
  );
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  _admin_user_id TEXT,
  _admin_role user_role,
  _target_user_id TEXT,
  _action TEXT,
  _details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.admin_activity_log (
    admin_user_id, admin_role, target_user_id, action, details
  ) VALUES (
    _admin_user_id, _admin_role, _target_user_id, _action, _details
  );
$$;

-- Insert default admin users
INSERT INTO public.user_roles (user_id, role) VALUES 
('useradmin@system.com', 'user_admin'),
('companyadmin@system.com', 'company_admin'),
('govadmin@system.com', 'government_admin')
ON CONFLICT (user_id, role) DO NOTHING;