-- Add updated_at column to tree_uploads table
ALTER TABLE public.tree_uploads 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create or replace the trigger for updated_at
DROP TRIGGER IF EXISTS update_tree_uploads_updated_at ON public.tree_uploads;

CREATE TRIGGER update_tree_uploads_updated_at
BEFORE UPDATE ON public.tree_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();