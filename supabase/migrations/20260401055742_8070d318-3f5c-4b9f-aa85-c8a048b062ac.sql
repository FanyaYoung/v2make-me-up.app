DROP POLICY IF EXISTS "Allow authenticated users to insert data" ON public."golden_and_adversarial_mst-e_image_ids";
CREATE POLICY "superadmins_insert_mste_data" ON public."golden_and_adversarial_mst-e_image_ids"
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));