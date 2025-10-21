-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Create profiles table for user profile information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- Using TEXT for demo purposes
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('ngo', 'company')),
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (relaxed for demo)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Create storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can upload profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can update profile photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can delete profile photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-photos');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();