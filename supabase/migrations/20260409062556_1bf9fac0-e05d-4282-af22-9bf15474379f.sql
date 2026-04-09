
-- Drop the existing permissive SELECT policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active referral codes" ON public.brand_referral_codes;
DROP POLICY IF EXISTS "authenticated_read_active_referral_codes" ON public.brand_referral_codes;

-- Create admin-only SELECT policy
CREATE POLICY "admin_read_referral_codes"
ON public.brand_referral_codes
FOR SELECT
TO authenticated
USING (public.is_admin_user());
