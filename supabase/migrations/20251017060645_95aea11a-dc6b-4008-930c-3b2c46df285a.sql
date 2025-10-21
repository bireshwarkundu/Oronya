-- Update trigger function to include government_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, user_type, display_name, organization, government_id)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'ngo'),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'organization',
    NEW.raw_user_meta_data->>'government_id'
  );
  RETURN NEW;
END;
$$;