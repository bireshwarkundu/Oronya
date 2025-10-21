-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    user_type, 
    display_name, 
    organization,
    location,
    phone_number,
    team_name,
    government_id,
    custom_user_id
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'personal'),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'organization',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'team_name',
    NEW.raw_user_meta_data->>'government_id',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'personal') IN ('ngo', 'personal', 'community_leader') 
      THEN generate_unique_user_id()
      ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    display_name = EXCLUDED.display_name,
    organization = EXCLUDED.organization,
    location = EXCLUDED.location,
    phone_number = EXCLUDED.phone_number,
    team_name = EXCLUDED.team_name,
    government_id = EXCLUDED.government_id,
    custom_user_id = COALESCE(profiles.custom_user_id, EXCLUDED.custom_user_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;