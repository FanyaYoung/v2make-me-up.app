-- Fix conflicting RLS policies on orders table
-- Remove redundant policies and create explicit, secure access control

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Admin can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Deny anonymous access to orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can read orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create a comprehensive, secure policy structure
-- 1. Users can only SELECT their own orders
CREATE POLICY "users_select_own_orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Admins can perform all operations on all orders
CREATE POLICY "admins_manage_all_orders" ON public.orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        (profiles.preferences ->> 'role') = 'admin'
        OR (profiles.preferences ->> 'is_admin') = 'true'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        (profiles.preferences ->> 'role') = 'admin'
        OR (profiles.preferences ->> 'is_admin') = 'true'
      )
    )
  );

-- 3. Service role (for edge functions) can perform all operations
-- This is secure because service_role is only accessible to server-side functions
CREATE POLICY "service_role_full_access" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Explicitly deny all access to anonymous users
-- While technically redundant, this makes security intent clear
CREATE POLICY "deny_anonymous_access" ON public.orders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (additional security)
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;