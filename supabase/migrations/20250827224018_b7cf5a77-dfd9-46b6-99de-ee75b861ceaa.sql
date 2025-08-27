-- Enhanced Foundation Matching System with Vector Search (Corrected)
-- Creates optimized tables and functions for improved skin tone matching

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create skin_tones table for organized skin tone data
CREATE TABLE IF NOT EXISTS public.skin_tones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tone_group text NOT NULL CHECK (tone_group <> ''),
  tone_name text NOT NULL UNIQUE,
  hex text NOT NULL CHECK (hex ~* '^#[0-9A-F]{6}$'),
  swatch_data_uri text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for skin_tones
ALTER TABLE public.skin_tones ENABLE ROW LEVEL SECURITY;

-- Allow public read access to skin tones
CREATE POLICY "Allow public read access to skin tones" 
ON public.skin_tones 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS skin_tones_group_idx ON public.skin_tones (tone_group);
CREATE INDEX IF NOT EXISTS skin_tones_name_trgm ON public.skin_tones USING gin (tone_name gin_trgm_ops);

-- Create optimized hex catalog view (using correct columns)
CREATE OR REPLACE VIEW public.hex_catalog AS
SELECT
  brand,
  product,
  name,
  hex,
  url,
  "imgSrc" AS imgsrc,
  categories AS description
FROM public.productsandshadeswithimages
WHERE hex IS NOT NULL AND hex <> '';

-- Add vector column to productsandshadeswithimages for fast similarity search
ALTER TABLE public.productsandshadeswithimages
  ADD COLUMN IF NOT EXISTS oklab_vec vector(3);

-- Create the enhanced find_closest_product_matches function (corrected)
CREATE OR REPLACE FUNCTION public.find_closest_product_matches(
  user_hex text,
  match_limit integer DEFAULT 10
)
RETURNS TABLE(
  brand text,
  product text,
  name text,
  hex text,
  color_distance double precision,
  url text,
  imgsrc text,
  description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  normalized_hex text;
BEGIN
  -- Validate/normalize: #RRGGBB
  IF user_hex IS NULL OR user_hex !~* '^#?[0-9A-F]{6}$' THEN
    RAISE EXCEPTION 'user_hex must be a 6-digit hex, with or without a leading #. Got: %', user_hex;
  END IF;

  normalized_hex := CASE WHEN user_hex ~* '^#' THEN user_hex ELSE '#' || user_hex END;

  RETURN QUERY
  WITH user_oklab AS (
    SELECT L, a, b FROM public.hex_to_oklab(normalized_hex)
  ),
  product_distances AS (
    SELECT
      p.brand,
      p.product,
      p.name,
      p.hex,
      p.url,
      p."imgSrc" AS imgsrc,
      p.categories AS description,
      sqrt(
        power(u.L - prod.L, 2) +
        power(u.a - prod.a, 2) +
        power(u.b - prod.b, 2)
      ) AS color_distance
    FROM public.productsandshadeswithimages p
    CROSS JOIN user_oklab u
    CROSS JOIN LATERAL public.hex_to_oklab(
      CASE WHEN p.hex ~* '^#' THEN p.hex ELSE '#' || p.hex END
    ) AS prod(L, a, b)
    WHERE p.hex ~* '^#?[0-9A-F]{6}$'
  )
  SELECT pd.brand, pd.product, pd.name, pd.hex, pd.color_distance, pd.url, pd.imgsrc, pd.description
  FROM product_distances pd
  ORDER BY pd.color_distance ASC
  LIMIT match_limit;
END;
$$;

-- Create function to find matches by tone name
CREATE OR REPLACE FUNCTION public.find_matches_for_tone(
  tone_name text,
  match_limit integer DEFAULT 10
)
RETURNS TABLE(
  brand text,
  product text,
  name text,
  hex text,
  color_distance double precision,
  url text,
  imgsrc text,
  description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE 
  t_hex text;
BEGIN
  SELECT s.hex INTO t_hex
  FROM public.skin_tones s
  WHERE lower(s.tone_name) = lower(find_matches_for_tone.tone_name)
  LIMIT 1;

  IF t_hex IS NULL THEN
    RAISE EXCEPTION 'No skin tone found named: %', tone_name;
  END IF;

  RETURN QUERY
    SELECT * FROM public.find_closest_product_matches(t_hex, match_limit);
END;
$$;