-- Drop the overly broad ALL policy and replace with scoped policies
DROP POLICY IF EXISTS "SuperAdmins can manage all roles" ON public.user_roles;

-- Superadmins can read all roles
CREATE POLICY "superadmins_select_all_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Keep existing: users can view their own roles (already exists, no change needed)

-- Only superadmins can insert roles
CREATE POLICY "superadmins_insert_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Only superadmins can update roles
CREATE POLICY "superadmins_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Only superadmins can delete roles
CREATE POLICY "superadmins_delete_roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Service role full access for triggers (assign_superadmin_role, ensure_default_user_role)
CREATE POLICY "service_role_manage_roles" ON public.user_roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);