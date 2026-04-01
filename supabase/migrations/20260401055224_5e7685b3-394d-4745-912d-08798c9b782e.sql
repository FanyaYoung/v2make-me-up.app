DROP POLICY IF EXISTS "Anyone can view active referral codes" ON public.brand_referral_codes;
CREATE POLICY "Authenticated users can view active referral codes" ON public.brand_referral_codes
  FOR SELECT TO authenticated
  USING (is_active = true);