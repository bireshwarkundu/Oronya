-- Fix infinite recursion in user_roles RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id::text 
    AND role = ANY(ARRAY['user_admin'::user_role, 'company_admin'::user_role, 'government_admin'::user_role])
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = (auth.uid())::text);

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin_user(auth.uid()) OR user_id = (auth.uid())::text);

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin_user(auth.uid()));