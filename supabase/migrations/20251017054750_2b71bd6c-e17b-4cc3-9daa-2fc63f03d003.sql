-- Create tree_uploads table to store uploaded tree images
CREATE TABLE public.tree_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  image_url text NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'pending',
  verification_notes text,
  co2_offset numeric(10,2) DEFAULT 0.15,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  CONSTRAINT status_check CHECK (status IN ('pending', 'verified', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.tree_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view their own tree uploads"
ON public.tree_uploads
FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users can insert their own tree uploads"
ON public.tree_uploads
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update their own tree uploads"
ON public.tree_uploads
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Admins can view all uploads
CREATE POLICY "Admins can view all tree uploads"
ON public.tree_uploads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()::text 
    AND role IN ('user_admin', 'government_admin')
  )
);

-- Admins can update any upload (for verification)
CREATE POLICY "Admins can update any tree upload"
ON public.tree_uploads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()::text 
    AND role IN ('user_admin', 'government_admin')
  )
);

-- Create index for better query performance
CREATE INDEX idx_tree_uploads_user_id ON public.tree_uploads(user_id);
CREATE INDEX idx_tree_uploads_status ON public.tree_uploads(status);

-- Add trigger for updated_at
CREATE TRIGGER update_tree_uploads_updated_at
BEFORE UPDATE ON public.tree_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();