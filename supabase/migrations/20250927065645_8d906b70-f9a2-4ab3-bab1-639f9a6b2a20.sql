-- Create table to store OTP verification codes
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP verification
CREATE POLICY "Anyone can insert OTP verification" 
ON public.otp_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can select their own OTP verification" 
ON public.otp_verifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update their own OTP verification" 
ON public.otp_verifications 
FOR UPDATE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);