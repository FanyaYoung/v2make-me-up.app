-- Remove the potentially problematic admin policy that could cause recursion
DROP POLICY IF EXISTS "admins_can_manage_profiles" ON public.profiles;

-- Create a security definer function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      (preferences->>'role' = 'admin') OR 
      (preferences->>'is_admin' = 'true')
    )
  );
$$;

-- Create a new admin policy using the security definer function
CREATE POLICY "admins_can_manage_all_profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Also create a policy to allow service role access for system operations only
CREATE POLICY "service_role_can_manage_profiles" 
ON public.profiles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);