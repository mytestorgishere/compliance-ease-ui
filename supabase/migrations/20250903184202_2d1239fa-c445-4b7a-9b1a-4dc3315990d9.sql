-- Fix critical security vulnerability in subscribers table UPDATE policy
-- Current policy allows any user to update any subscription record

-- Drop the insecure UPDATE policy
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure UPDATE policy that only allows users to update their own records
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Verify the fix by checking all policies
SELECT 
  policyname,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'subscribers'
ORDER BY cmd, policyname;