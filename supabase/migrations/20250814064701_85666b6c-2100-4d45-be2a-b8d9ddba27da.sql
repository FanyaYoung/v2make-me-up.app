-- Fix the overly permissive "Service can manage orders" policy
-- This policy currently allows anyone to access all orders with USING (true)
-- We need to restrict it to only service role access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service can manage orders" ON public.orders;

-- Create a new restricted policy that only allows service role access
-- The service role is used by edge functions to process orders
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the existing user and admin policies remain intact and are properly configured
-- Users can only view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policy should remain as is, but let's ensure it's properly defined
DROP POLICY IF EXISTS "Admin can manage all orders" ON public.orders;
CREATE POLICY "Admin can manage all orders" ON public.orders
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