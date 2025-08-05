-- Remove unused indexes (Part 4) - Brand and product management
DROP INDEX IF EXISTS public.idx_brand_referral_codes_brand_id;
DROP INDEX IF EXISTS public.idx_purchase_options_brand_id;
DROP INDEX IF EXISTS public.idx_brands_tier;
DROP INDEX IF EXISTS public.idx_products_brand;
DROP INDEX IF EXISTS public.idx_products_category;
DROP INDEX IF EXISTS public.idx_product_variants_product;
DROP INDEX IF EXISTS public.idx_product_ingredients_product;