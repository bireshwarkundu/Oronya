-- Drop existing admin update policy
DROP POLICY IF EXISTS "Admins can update any tree upload" ON public.tree_uploads;

-- Create improved policy for government admins to update verification status
CREATE POLICY "Government admins can update verification status"
ON public.tree_uploads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()::text 
    AND role = 'government_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()::text 
    AND role = 'government_admin'
  )
);