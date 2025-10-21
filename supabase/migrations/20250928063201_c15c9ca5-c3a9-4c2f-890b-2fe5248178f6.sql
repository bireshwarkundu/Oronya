-- Update the user_type check constraint to include government_employee
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add the new constraint with government_employee included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('ngo', 'company', 'government_employee', 'individual'));