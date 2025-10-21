-- Function to generate unique user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id text;
  id_exists boolean;
  counter int := 1;
BEGIN
  LOOP
    -- Generate ID in format USER001, USER002, etc.
    new_id := 'USER' || LPAD(counter::text, 3, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE custom_user_id = new_id) INTO id_exists;
    
    -- If ID doesn't exist, return it
    IF NOT id_exists THEN
      RETURN new_id;
    END IF;
    
    -- Otherwise, increment counter and try again
    counter := counter + 1;
  END LOOP;
END;
$$;

-- Update the handle_new_user function to generate custom_user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    user_type, 
    display_name, 
    organization, 
    government_id,
    custom_user_id
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'ngo'),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'organization',
    NEW.raw_user_meta_data->>'government_id',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'ngo') IN ('ngo', 'company') 
      THEN generate_unique_user_id()
      ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    display_name = EXCLUDED.display_name,
    organization = EXCLUDED.organization,
    government_id = EXCLUDED.government_id,
    custom_user_id = COALESCE(profiles.custom_user_id, EXCLUDED.custom_user_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add unique constraint to custom_user_id
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_custom_user_id_unique UNIQUE (custom_user_id);

-- Update existing users without custom_user_id (only for ngo/company types)
UPDATE public.profiles
SET custom_user_id = generate_unique_user_id()
WHERE custom_user_id IS NULL 
AND user_type IN ('ngo', 'company');