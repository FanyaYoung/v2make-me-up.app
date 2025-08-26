-- Create skin tone HEX references table
CREATE TABLE public.skin_tone_hex_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hex_color TEXT NOT NULL UNIQUE,
  lab_l NUMERIC NOT NULL,
  lab_a NUMERIC NOT NULL, 
  lab_b NUMERIC NOT NULL,
  undertone TEXT NOT NULL CHECK (undertone IN ('Cool', 'Warm', 'Neutral', 'Olive')),
  depth_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create foundation shade matches table for cross-brand recommendations
CREATE TABLE public.foundation_shade_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skin_hex TEXT NOT NULL,
  foundation_brand TEXT NOT NULL,
  foundation_product TEXT NOT NULL,
  shade_name TEXT NOT NULL,
  shade_hex TEXT NOT NULL,
  delta_e_distance NUMERIC NOT NULL,
  match_score NUMERIC NOT NULL,
  undertone_match BOOLEAN NOT NULL DEFAULT true,
  lightness_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shade ladders table for brand/product organization
CREATE TABLE public.shade_ladders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  shade_name TEXT NOT NULL,
  shade_hex TEXT NOT NULL,
  lab_l NUMERIC NOT NULL,
  lab_a NUMERIC NOT NULL,
  lab_b NUMERIC NOT NULL,
  undertone TEXT NOT NULL CHECK (undertone IN ('Cool', 'Warm', 'Neutral', 'Olive')),
  lightness_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skin_tone_hex_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_shade_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shade_ladders ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view skin tone hex references" 
ON public.skin_tone_hex_references 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view foundation shade matches" 
ON public.foundation_shade_matches 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view shade ladders" 
ON public.shade_ladders 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_skin_tone_hex_references_hex ON public.skin_tone_hex_references(hex_color);
CREATE INDEX idx_foundation_shade_matches_skin_hex ON public.foundation_shade_matches(skin_hex);
CREATE INDEX idx_foundation_shade_matches_delta_e ON public.foundation_shade_matches(delta_e_distance);
CREATE INDEX idx_shade_ladders_brand_product ON public.shade_ladders(brand, product_name);
CREATE INDEX idx_shade_ladders_lightness ON public.shade_ladders(lightness_rank);

-- Create function to find closest shade matches
CREATE OR REPLACE FUNCTION public.find_closest_shade_matches(
  user_hex TEXT,
  match_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  brand TEXT,
  product_name TEXT,
  shade_name TEXT,
  shade_hex TEXT,
  match_score NUMERIC,
  delta_e_distance NUMERIC,
  undertone_match BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fsm.foundation_brand as brand,
    fsm.foundation_product as product_name,
    fsm.shade_name,
    fsm.shade_hex,
    fsm.match_score,
    fsm.delta_e_distance,
    fsm.undertone_match
  FROM public.foundation_shade_matches fsm
  WHERE fsm.skin_hex = user_hex
  ORDER BY fsm.match_score DESC, fsm.delta_e_distance ASC
  LIMIT match_limit;
END;
$$;

-- Create function to get shade ladder for a brand/product
CREATE OR REPLACE FUNCTION public.get_shade_ladder(
  brand_name TEXT,
  product_name TEXT
)
RETURNS TABLE(
  shade_name TEXT,
  shade_hex TEXT,
  lab_l NUMERIC,
  undertone TEXT,
  lightness_rank INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.shade_name,
    sl.shade_hex,
    sl.lab_l,
    sl.undertone,
    sl.lightness_rank
  FROM public.shade_ladders sl
  WHERE sl.brand = brand_name AND sl.product_name = product_name
  ORDER BY sl.lightness_rank ASC;
END;
$$;