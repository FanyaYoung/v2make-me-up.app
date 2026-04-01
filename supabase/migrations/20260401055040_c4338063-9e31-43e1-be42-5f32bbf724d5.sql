DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers_v2;
CREATE POLICY "insert_own_subscription" ON public.subscribers_v2
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());