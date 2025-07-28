-- Database Synchronization Migration
-- This migration consolidates data from multiple makeup databases

-- First, let's extract and insert unique brands from the review data
INSERT INTO public.brands (name, description, is_active)
SELECT DISTINCT 
  TRIM(brand) as name,
  'Brand imported from Ulta reviews data' as description,
  true as is_active
FROM "Ulta Makeup Reviews"
WHERE brand IS NOT NULL 
  AND TRIM(brand) != ''
  AND TRIM(brand) NOT IN ('NA', 'Ask A Question', 'Find your shade', 'N/A', 'null')
  AND NOT EXISTS (
    SELECT 1 FROM public.brands b WHERE LOWER(b.name) = LOWER(TRIM("Ulta Makeup Reviews".brand))
  );

-- Extract brands from cleaned makeup products as well
INSERT INTO public.brands (name, description, is_active)
SELECT DISTINCT 
  TRIM(brand) as name,
  'Brand imported from cleaned makeup data' as description,
  true as is_active
FROM "cleaned makeup products"
WHERE brand IS NOT NULL 
  AND TRIM(brand) != ''
  AND TRIM(brand) NOT IN ('NA', 'Ask A Question', 'Find your shade', 'N/A', 'null')
  AND NOT EXISTS (
    SELECT 1 FROM public.brands b WHERE LOWER(b.name) = LOWER(TRIM("cleaned makeup products".brand))
  );

-- Migrate data from Ulta Makeup Reviews to cosmetics_products
INSERT INTO public.cosmetics_products (
  product_name,
  brand_id,
  category,
  subcategory,
  product_type,
  price,
  rating,
  total_reviews,
  description,
  product_url,
  dataset_name,
  metadata
)
SELECT DISTINCT
  COALESCE(NULLIF(TRIM(umr.product_name), ''), 'Unknown Product') as product_name,
  b.id as brand_id,
  COALESCE(NULLIF(TRIM(umr.category), ''), 'Beauty') as category,
  NULL as subcategory,
  CASE 
    WHEN LOWER(umr.category) LIKE '%foundation%' THEN 'foundation'
    WHEN LOWER(umr.category) LIKE '%concealer%' THEN 'concealer'
    WHEN LOWER(umr.category) LIKE '%primer%' THEN 'primer'
    WHEN LOWER(umr.category) LIKE '%powder%' THEN 'powder'
    ELSE 'makeup'
  END as product_type,
  CASE 
    WHEN umr.price ~ '^[0-9]+\.?[0-9]*$' THEN umr.price::numeric
    ELSE NULL
  END as price,
  umr.average_rating,
  umr.review_count as total_reviews,
  umr.description,
  umr.product_link as product_url,
  'ulta_reviews' as dataset_name,
  jsonb_build_object(
    'item_id', umr.item_id,
    'pros', umr.pros,
    'cons', umr.cons,
    'best_uses', umr.best_uses,
    'rating_breakdown', jsonb_build_object(
      'star_1', umr.review_star_1,
      'star_2', umr.review_star_2,
      'star_3', umr.review_star_3,
      'star_4', umr.review_star_4,
      'star_5', umr.review_star_5
    ),
    'num_shades', umr.num_shades
  ) as metadata
FROM "Ulta Makeup Reviews" umr
LEFT JOIN public.brands b ON LOWER(b.name) = LOWER(TRIM(umr.brand))
WHERE umr.brand IS NOT NULL 
  AND TRIM(umr.brand) NOT IN ('NA', 'Ask A Question', 'Find your shade', 'N/A', 'null')
  AND umr.product_name IS NOT NULL
  AND TRIM(umr.product_name) != '';

-- Migrate data from cleaned makeup products (avoiding duplicates)
INSERT INTO public.cosmetics_products (
  product_name,
  brand_id,
  category,
  subcategory,
  product_type,
  price,
  rating,
  total_reviews,
  description,
  product_url,
  dataset_name,
  metadata
)
SELECT DISTINCT
  COALESCE(NULLIF(TRIM(cmp.product_name), ''), 'Unknown Product') as product_name,
  b.id as brand_id,
  COALESCE(NULLIF(TRIM(cmp.category), ''), 'Beauty') as category,
  NULL as subcategory,
  CASE 
    WHEN LOWER(cmp.category) LIKE '%foundation%' THEN 'foundation'
    WHEN LOWER(cmp.category) LIKE '%concealer%' THEN 'concealer'
    WHEN LOWER(cmp.category) LIKE '%primer%' THEN 'primer'
    WHEN LOWER(cmp.category) LIKE '%powder%' THEN 'powder'
    ELSE 'makeup'
  END as product_type,
  CASE 
    WHEN cmp.price ~ '^[0-9]+\.?[0-9]*$' THEN cmp.price::numeric
    ELSE NULL
  END as price,
  cmp.average_rating,
  cmp.review_count as total_reviews,
  cmp.description,
  cmp.product_link as product_url,
  'cleaned_makeup' as dataset_name,
  jsonb_build_object(
    'item_id', cmp.item_id,
    'pros', cmp.pros,
    'cons', cmp.cons,
    'best_uses', cmp.best_uses,
    'rating_breakdown', jsonb_build_object(
      'star_1', cmp.review_star_1,
      'star_2', cmp.review_star_2,
      'star_3', cmp.review_star_3,
      'star_4', cmp.review_star_4,
      'star_5', cmp.review_star_5
    ),
    'num_shades', cmp.num_shades
  ) as metadata
FROM "cleaned makeup products" cmp
LEFT JOIN public.brands b ON LOWER(b.name) = LOWER(TRIM(cmp.brand))
WHERE cmp.brand IS NOT NULL 
  AND TRIM(cmp.brand) NOT IN ('NA', 'Ask A Question', 'Find your shade', 'N/A', 'null')
  AND cmp.product_name IS NOT NULL
  AND TRIM(cmp.product_name) != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.cosmetics_products cp 
    WHERE LOWER(cp.product_name) = LOWER(TRIM(cmp.product_name))
    AND cp.brand_id = b.id
  );

-- Create foundation products from cosmetics data where missing
INSERT INTO public.foundation_products (
  name,
  brand_id,
  description,
  price,
  coverage,
  finish,
  product_url,
  is_active
)
SELECT DISTINCT
  cp.product_name as name,
  cp.brand_id,
  cp.description,
  cp.price,
  'medium'::coverage_type as coverage,
  'natural'::finish_type as finish,
  cp.product_url,
  true as is_active
FROM public.cosmetics_products cp
WHERE cp.product_type = 'foundation'
  AND cp.brand_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.foundation_products fp 
    WHERE LOWER(fp.name) = LOWER(cp.product_name)
    AND fp.brand_id = cp.brand_id
  )
LIMIT 50; -- Limit to avoid overwhelming the system

-- Update cosmetics products to link with foundation products
UPDATE public.cosmetics_products 
SET metadata = metadata || jsonb_build_object('foundation_product_id', fp.id)
FROM public.foundation_products fp
WHERE cosmetics_products.product_type = 'foundation'
  AND cosmetics_products.brand_id = fp.brand_id
  AND LOWER(cosmetics_products.product_name) = LOWER(fp.name);

-- Create some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_brand_id ON public.cosmetics_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_product_type ON public.cosmetics_products(product_type);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_category ON public.cosmetics_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_dataset ON public.cosmetics_products(dataset_name);

-- Update statistics
ANALYZE public.cosmetics_products;
ANALYZE public.brands;
ANALYZE public.foundation_products;