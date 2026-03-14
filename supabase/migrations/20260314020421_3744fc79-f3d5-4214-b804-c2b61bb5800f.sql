
-- Fix subscribers
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription" ON public.subscribers FOR UPDATE TO public
  USING (user_id = auth.uid() OR email = auth.email())
  WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Fix subscribers_new
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers_new;
CREATE POLICY "update_own_subscription" ON public.subscribers_new FOR UPDATE TO public
  USING (user_id = auth.uid() OR email = auth.email())
  WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Fix subscribers_v2
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers_v2;
CREATE POLICY "update_own_subscription" ON public.subscribers_v2 FOR UPDATE TO public
  USING (user_id = auth.uid() OR email = auth.email())
  WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Fix subscription_data
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscription_data;
CREATE POLICY "update_own_subscription" ON public.subscription_data FOR UPDATE TO public
  USING (user_id = auth.uid() OR email = auth.email())
  WITH CHECK (user_id = auth.uid() OR email = auth.email());
