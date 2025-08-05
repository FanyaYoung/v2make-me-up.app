-- Add indexes for unindexed foreign keys (Part 1)
CREATE INDEX IF NOT EXISTS idx_foundation_matches_region_id ON public.foundation_matches(region_id);
CREATE INDEX IF NOT EXISTS idx_foundation_matches_shade_id ON public.foundation_matches(shade_id);
CREATE INDEX IF NOT EXISTS idx_product_availability_shade_id ON public.product_availability(shade_id);
CREATE INDEX IF NOT EXISTS idx_product_availability_store_id ON public.product_availability(store_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_category_id ON public.product_categories(parent_category_id);