-- Remove unused indexes (Part 3) - Product and cosmetics related
DROP INDEX IF EXISTS public.idx_product_availability_product_shade;
DROP INDEX IF EXISTS public.idx_cosmetics_products_brand_id;
DROP INDEX IF EXISTS public.idx_cosmetics_products_dataset_name;
DROP INDEX IF EXISTS public.idx_cosmetics_products_category;
DROP INDEX IF EXISTS public.idx_cosmetics_product_attributes_product_id;
DROP INDEX IF EXISTS public.idx_cosmetics_product_attributes_name;
DROP INDEX IF EXISTS public.idx_cleaned_makeup_products_category;