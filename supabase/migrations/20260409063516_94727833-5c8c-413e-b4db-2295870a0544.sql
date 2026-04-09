
-- Drop existing insert/update policies for superadmins
DROP POLICY IF EXISTS "superadmins_insert_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmins_update_roles" ON public.user_roles;

-- Recreate INSERT policy: superadmins cannot grant superadmin role
CREATE POLICY "superadmins_insert_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_superadmin(auth.uid())
  AND role != 'superadmin'::app_role
);

-- Recreate UPDATE policy: superadmins cannot set role to superadmin
CREATE POLICY "superadmins_update_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (
  public.is_superadmin(auth.uid())
  AND role != 'superadmin'::app_role
);

-- Allow service_role to manage all roles including superadmin
DROP POLICY IF EXISTS "service_role_manage_roles" ON public.user_roles;
CREATE POLICY "service_role_manage_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
