
-- Fix 1: Replace vulnerable admin policies on orders table
DROP POLICY IF EXISTS "admins_manage_all_orders" ON public.orders;
CREATE POLICY "admins_manage_all_orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Fix 2: Replace vulnerable admin policies on order_items table
DROP POLICY IF EXISTS "Admin can manage all order items" ON public.order_items;
CREATE POLICY "Admin can manage all order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Fix 3: Restrict subscriber INSERT policies to authenticated users with user_id check
-- subscribers table
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "insert_subscription" ON public.subscribers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- subscribers_new table
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers_new;
CREATE POLICY "insert_subscription" ON public.subscribers_new
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- subscription_data table
DROP POLICY IF EXISTS "insert_subscription" ON public.subscription_data;
CREATE POLICY "insert_subscription" ON public.subscription_data
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
;
