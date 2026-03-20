
-- Fix user_activity INSERT policy: restrict to authenticated users with ownership check
DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity;

CREATE POLICY "authenticated_insert_own_activity"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
