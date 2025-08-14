-- Fix the overly permissive "Service can manage order items" policy
-- This policy currently allows anyone to access all order items with USING (true)

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service can manage order items" ON public.order_items;

-- Create a new restricted policy that only allows service role access
CREATE POLICY "Service role can manage order items" ON public.order_items
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the existing user and admin policies remain properly configured
-- Users can only view order items from their own orders
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admin policy for order items
DROP POLICY IF EXISTS "Admin can manage all order items" ON public.order_items;
CREATE POLICY "Admin can manage all order items" ON public.order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        (profiles.preferences ->> 'role'::text) = 'admin'::text 
        OR (profiles.preferences ->> 'is_admin'::text) = 'true'::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        (profiles.preferences ->> 'role'::text) = 'admin'::text 
        OR (profiles.preferences ->> 'is_admin'::text) = 'true'::text
      )
    )
  );