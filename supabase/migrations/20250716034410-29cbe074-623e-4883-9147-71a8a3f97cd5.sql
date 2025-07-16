-- Fix database functions with proper security and search path

-- Drop the problematic duplicate function
DROP FUNCTION IF EXISTS public.add_makeup_brand(text, text);

-- Update the main add_makeup_brand function with proper search path
CREATE OR REPLACE FUNCTION public.add_makeup_brand(
    p_name text,
    p_country text DEFAULT NULL,
    p_founded_year integer DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_website text DEFAULT NULL,
    p_is_cruelty_free boolean DEFAULT false,
    p_is_vegan boolean DEFAULT false
)
RETURNS public.makeup_brands
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_brand public.makeup_brands;
BEGIN
    INSERT INTO public.makeup_brands (
        name, country_of_origin, founded_year, 
        description, website, is_cruelty_free, is_vegan
    ) VALUES (
        p_name, p_country, p_founded_year, 
        p_description, p_website, p_is_cruelty_free, p_is_vegan
    ) RETURNING * INTO v_brand;
    
    RETURN v_brand;
END;
$$;

-- Update add_product function with proper search path
CREATE OR REPLACE FUNCTION public.add_product(
    p_brand_name text,
    p_category_name text,
    p_name text,
    p_description text DEFAULT NULL,
    p_price numeric DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_brand_id bigint;
    v_category_id bigint;
    v_product public.products;
BEGIN
    -- Find or create brand
    SELECT id INTO v_brand_id 
    FROM public.makeup_brands 
    WHERE name = p_brand_name;
    
    IF v_brand_id IS NULL THEN
        v_brand_id := (SELECT id FROM public.add_makeup_brand(p_brand_name)).id;
    END IF;
    
    -- Find or create category
    SELECT id INTO v_category_id 
    FROM public.product_categories 
    WHERE name = p_category_name;
    
    IF v_category_id IS NULL THEN
        INSERT INTO public.product_categories (name) 
        VALUES (p_category_name) 
        RETURNING id INTO v_category_id;
    END IF;
    
    -- Insert product
    INSERT INTO public.products (
        brand_id, category_id, name, description, price
    ) VALUES (
        v_brand_id, v_category_id, p_name, p_description, p_price
    ) RETURNING * INTO v_product;
    
    RETURN v_product;
END;
$$;