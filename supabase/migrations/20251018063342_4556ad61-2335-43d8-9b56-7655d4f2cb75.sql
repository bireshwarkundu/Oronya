-- Create table for caching tree image analysis results
CREATE TABLE public.tree_image_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT NOT NULL UNIQUE,
  tree_count INTEGER NOT NULL,
  land_cover_class TEXT NOT NULL,
  estimated_area_hectares NUMERIC NOT NULL,
  confidence TEXT NOT NULL,
  analysis_notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tree_image_analysis_cache_hash ON public.tree_image_analysis_cache(image_hash);

-- Enable RLS
ALTER TABLE public.tree_image_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache
CREATE POLICY "Authenticated users can read analysis cache"
ON public.tree_image_analysis_cache
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow service role to insert/update cache (for edge functions)
CREATE POLICY "Service role can manage cache"
ON public.tree_image_analysis_cache
FOR ALL
USING (auth.role() = 'service_role');