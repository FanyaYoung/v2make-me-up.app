-- hex_catelog: read-only catalog data
CREATE POLICY "authenticated_select_hex_catelog" ON public.hex_catelog
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_hex_catelog" ON public.hex_catelog
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_update_hex_catelog" ON public.hex_catelog
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_delete_hex_catelog" ON public.hex_catelog
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- hex_catalog_source: read-only catalog data
CREATE POLICY "authenticated_select_hex_catalog_source" ON public.hex_catalog_source
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_hex_catalog_source" ON public.hex_catalog_source
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_update_hex_catalog_source" ON public.hex_catalog_source
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_delete_hex_catalog_source" ON public.hex_catalog_source
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- full_pricing_website_photos: read-only product data
CREATE POLICY "authenticated_select_full_pricing" ON public.full_pricing_website_photos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_full_pricing" ON public.full_pricing_website_photos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_update_full_pricing" ON public.full_pricing_website_photos
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_delete_full_pricing" ON public.full_pricing_website_photos
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- Product Pricing: read-only product data
CREATE POLICY "authenticated_select_product_pricing" ON public."Product Pricing"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_product_pricing" ON public."Product Pricing"
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_update_product_pricing" ON public."Product Pricing"
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "admin_delete_product_pricing" ON public."Product Pricing"
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- Service role full access for all four tables
CREATE POLICY "service_role_hex_catelog" ON public.hex_catelog FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_hex_catalog_source" ON public.hex_catalog_source FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_pricing" ON public.full_pricing_website_photos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_product_pricing" ON public."Product Pricing" FOR ALL TO service_role USING (true) WITH CHECK (true);