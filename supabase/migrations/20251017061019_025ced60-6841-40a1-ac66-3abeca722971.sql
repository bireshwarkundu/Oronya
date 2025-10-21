-- Add unique constraint to user_id in profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Update the trigger function to handle conflicts gracefully
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
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    display_name = EXCLUDED.display_name,
    organization = EXCLUDED.organization,
    government_id = EXCLUDED.government_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;