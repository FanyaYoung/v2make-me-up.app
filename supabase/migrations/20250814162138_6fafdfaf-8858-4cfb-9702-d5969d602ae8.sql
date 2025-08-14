-- Fix security vulnerability in orders table RLS policies
-- The current "Service role can manage orders" policy is too broad
-- We'll create more specific policies for different service operations

-- Drop the overly broad service role policy
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;

-- Create separate service role policies for specific operations
-- Allow service role to INSERT orders (for order processing)
CREATE POLICY "Service role can create orders" ON public.orders
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Allow service role to UPDATE orders (for status updates, shipping info)
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to SELECT orders (for order processing and admin functions)
CREATE POLICY "Service role can read orders" ON public.orders
  FOR SELECT 
  TO service_role
  USING (true);

-- Ensure we have a policy to prevent anonymous access
-- Create explicit policy to deny access to unauthenticated users
CREATE POLICY "Deny anonymous access to orders" ON public.orders
  FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Verify existing user and admin policies are still in place
-- Users can only view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policy (recreate to ensure it's properly configured)
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