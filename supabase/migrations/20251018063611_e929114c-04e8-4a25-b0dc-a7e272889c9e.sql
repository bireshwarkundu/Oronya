-- Add tree_count column to tree_uploads table
ALTER TABLE public.tree_uploads
ADD COLUMN tree_count INTEGER DEFAULT 0;