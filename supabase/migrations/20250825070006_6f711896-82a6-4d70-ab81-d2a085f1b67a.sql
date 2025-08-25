-- First, let's ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any potentially problematic existing policies that might allow broader access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create strict RLS policies that ensure users can only access their own data
CREATE POLICY "users_can_select_own_profile_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile_only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile_only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Explicitly deny all access to anonymous users
CREATE POLICY "deny_anonymous_access_to_profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Add admin access policy for necessary administrative functions
-- This requires the admin to be properly authenticated and have admin role
CREATE POLICY "admins_can_manage_profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      (preferences->>'role' = 'admin') OR 
      (preferences->>'is_admin' = 'true')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      (preferences->>'role' = 'admin') OR 
      (preferences->>'is_admin' = 'true')
    )
  )
);