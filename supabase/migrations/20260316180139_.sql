
-- Remove the overly permissive ALL policy
DROP POLICY IF EXISTS "System can manage analytics" ON public.user_analytics;

-- Allow only service_role to insert analytics (used by edge functions)
CREATE POLICY "Service role can insert analytics"
  ON public.user_analytics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow only service_role to update analytics (for upserts in edge functions)
CREATE POLICY "Service role can update analytics"
  ON public.user_analytics
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
;
