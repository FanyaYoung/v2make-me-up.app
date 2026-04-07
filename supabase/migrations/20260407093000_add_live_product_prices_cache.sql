CREATE TABLE IF NOT EXISTS public.live_product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL UNIQUE,
  brand text NOT NULL,
  product text NOT NULL,
  retailer text,
  source text NOT NULL DEFAULT 'rakuten',
  currency text NOT NULL DEFAULT 'USD',
  price numeric,
  sale_price numeric,
  image_url text,
  product_url text,
  affiliate_url text,
  availability text,
  raw_payload jsonb,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_product_prices_source_check CHECK (source IN ('rakuten', 'cache', 'manual', 'unavailable'))
);

CREATE INDEX IF NOT EXISTS idx_live_product_prices_brand_product
  ON public.live_product_prices (brand, product);

CREATE INDEX IF NOT EXISTS idx_live_product_prices_expires_at
  ON public.live_product_prices (expires_at);

ALTER TABLE public.live_product_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_live_product_prices" ON public.live_product_prices;
CREATE POLICY "authenticated_select_live_product_prices"
  ON public.live_product_prices
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_live_product_prices" ON public.live_product_prices;
CREATE POLICY "admin_insert_live_product_prices"
  ON public.live_product_prices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "admin_update_live_product_prices" ON public.live_product_prices;
CREATE POLICY "admin_update_live_product_prices"
  ON public.live_product_prices
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_live_product_prices" ON public.live_product_prices;
CREATE POLICY "admin_delete_live_product_prices"
  ON public.live_product_prices
  FOR DELETE TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "service_role_live_product_prices" ON public.live_product_prices;
CREATE POLICY "service_role_live_product_prices"
  ON public.live_product_prices
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_live_product_prices_updated_at ON public.live_product_prices;
CREATE TRIGGER update_live_product_prices_updated_at
  BEFORE UPDATE ON public.live_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
