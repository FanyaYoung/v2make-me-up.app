-- Remove the overly permissive service role policy
DROP POLICY IF EXISTS "service_role_full_access" ON public.orders;

-- Create specific service role policies for necessary operations only
CREATE POLICY "service_role_can_insert_orders" 
ON public.orders 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "service_role_can_update_shipping" 
ON public.orders 
FOR UPDATE 
TO service_role 
USING (true)
WITH CHECK (true);

-- Ensure users can only insert orders for themselves
CREATE POLICY "users_can_insert_own_orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure users can only update their own orders (for status updates, etc.)
CREATE POLICY "users_can_update_own_orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);