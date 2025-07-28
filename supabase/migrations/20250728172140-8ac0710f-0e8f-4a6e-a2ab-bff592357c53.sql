-- Database Synchronization Migration (Without Enum Creation)
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
    'num_shades', umr.num_shades
  ) as metadata
FROM "Ulta Makeup Reviews" umr
LEFT JOIN public.brands b ON LOWER(b.name) = LOWER(TRIM(umr.brand))
WHERE umr.brand IS NOT NULL 
  AND TRIM(umr.brand) NOT IN ('NA', 'Ask A Question', 'Find your shade', 'N/A', 'null')
  AND umr.product_name IS NOT NULL
  AND TRIM(umr.product_name) != '';

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
  'natural'::finish_type as coverage,
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
LIMIT 50;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_brand_id ON public.cosmetics_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_product_type ON public.cosmetics_products(product_type);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_category ON public.cosmetics_products(category);

-- Update statistics
ANALYZE public.cosmetics_products;
ANALYZE public.brands;
ANALYZE public.foundation_products;