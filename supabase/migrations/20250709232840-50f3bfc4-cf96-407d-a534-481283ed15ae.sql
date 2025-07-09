-- Create cosmetics_products table for imported Kaggle data
CREATE TABLE public.cosmetics_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_type TEXT,
    category TEXT,
    subcategory TEXT,
    description TEXT,
    ingredients TEXT,
    price NUMERIC,
    rating NUMERIC,
    total_reviews INTEGER,
    image_url TEXT,
    product_url TEXT,
    brand_id UUID REFERENCES public.brands(id),
    dataset_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cosmetics_product_attributes table for flexible attribute storage
CREATE TABLE public.cosmetics_product_attributes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.cosmetics_products(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cosmetics tables
ALTER TABLE public.cosmetics_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_product_attributes ENABLE ROW LEVEL SECURITY;

-- Create policies for cosmetics_products
CREATE POLICY "Anyone can view cosmetics products" 
ON public.cosmetics_products 
FOR SELECT 
USING (true);

-- Create policies for cosmetics_product_attributes  
CREATE POLICY "Anyone can view cosmetics product attributes" 
ON public.cosmetics_product_attributes 
FOR SELECT 
USING (true);

-- Create function to get statistics about imported cosmetics data
CREATE OR REPLACE FUNCTION public.get_cosmetics_import_stats()
RETURNS TABLE (
  dataset_name text,
  total_products bigint,
  brands_count bigint,
  product_types_count bigint,
  categories_count bigint,
  avg_price numeric,
  avg_rating numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT 
    cp.dataset_name,
    COUNT(*) as total_products,
    COUNT(DISTINCT cp.brand_id) as brands_count,
    COUNT(DISTINCT cp.product_type) as product_types_count,
    COUNT(DISTINCT cp.category) as categories_count,
    AVG(cp.price) as avg_price,
    AVG(cp.rating) as avg_rating
  FROM public.cosmetics_products cp
  GROUP BY cp.dataset_name
  ORDER BY total_products DESC;
$$;

-- Create function to match cosmetics brands with existing brands
CREATE OR REPLACE FUNCTION public.match_cosmetics_brands()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update cosmetics_products to link with existing brands based on name similarity
  UPDATE public.cosmetics_products cp
  SET brand_id = b.id
  FROM public.brands b
  WHERE cp.brand_id IS NULL
    AND (
      LOWER(cp.metadata->>'brand') = LOWER(b.name)
      OR LOWER(cp.metadata->>'brand_name') = LOWER(b.name)
      OR LOWER(cp.metadata->>'manufacturer') = LOWER(b.name)
    );
END;
$$;

-- Create function to link foundation products
CREATE OR REPLACE FUNCTION public.link_foundation_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Link cosmetics products to foundation_products where appropriate
  -- This is a placeholder - you can customize the matching logic
  UPDATE public.cosmetics_products cp
  SET metadata = cp.metadata || jsonb_build_object('linked_foundation', fp.id)
  FROM public.foundation_products fp
  WHERE cp.product_type ILIKE '%foundation%'
    AND cp.brand_id = fp.brand_id
    AND LOWER(cp.product_name) = LOWER(fp.name);
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cosmetics_products_updated_at
BEFORE UPDATE ON public.cosmetics_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_cosmetics_products_brand_id ON public.cosmetics_products(brand_id);
CREATE INDEX idx_cosmetics_products_dataset_name ON public.cosmetics_products(dataset_name);
CREATE INDEX idx_cosmetics_products_product_type ON public.cosmetics_products(product_type);
CREATE INDEX idx_cosmetics_products_category ON public.cosmetics_products(category);
CREATE INDEX idx_cosmetics_product_attributes_product_id ON public.cosmetics_product_attributes(product_id);
CREATE INDEX idx_cosmetics_product_attributes_name ON public.cosmetics_product_attributes(attribute_name);