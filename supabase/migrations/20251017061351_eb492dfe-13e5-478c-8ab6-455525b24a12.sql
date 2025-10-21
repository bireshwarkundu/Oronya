-- Create a secure function to assign government admin role
CREATE OR REPLACE FUNCTION public.assign_government_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id::text, 'government_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_government_role TO authenticated;