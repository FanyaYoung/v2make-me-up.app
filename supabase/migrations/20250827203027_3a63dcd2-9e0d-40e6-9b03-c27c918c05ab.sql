-- Add hex_to_oklab function for accurate color distance calculations
CREATE OR REPLACE FUNCTION public.hex_to_oklab(hex TEXT)
RETURNS TABLE (L DOUBLE PRECISION, a DOUBLE PRECISION, b DOUBLE PRECISION)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  h TEXT := UPPER(TRIM(hex));
  r DOUBLE PRECISION; g DOUBLE PRECISION; bl DOUBLE PRECISION;
  rl DOUBLE PRECISION; gl DOUBLE PRECISION; blin DOUBLE PRECISION;
  l_ DOUBLE PRECISION; m_ DOUBLE PRECISION; s_ DOUBLE PRECISION;
  lms_l DOUBLE PRECISION; lms_m DOUBLE PRECISION; lms_s DOUBLE PRECISION;
BEGIN
  IF h ~ '^#?[0-9A-F]{6}$' THEN
    IF LEFT(h,1) = '#' THEN h := SUBSTRING(h FROM 2); END IF;
  ELSE
    RAISE EXCEPTION 'Invalid hex: % (expect #RRGGBB)', hex USING ERRCODE='22023';
  END IF;

  r  := (('x' || SUBSTRING(h FROM 1 FOR 2))::bit(8)::int)::float8 / 255.0;
  g  := (('x' || SUBSTRING(h FROM 3 FOR 2))::bit(8)::int)::float8 / 255.0;
  bl := (('x' || SUBSTRING(h FROM 5 FOR 2))::bit(8)::int)::float8 / 255.0;

  rl := CASE WHEN r  <= 0.04045 THEN r/12.92 ELSE POWER((r+0.055)/1.055, 2.4) END;
  gl := CASE WHEN g  <= 0.04045 THEN g/12.92 ELSE POWER((g+0.055)/1.055, 2.4) END;
  blin := CASE WHEN bl <= 0.04045 THEN bl/12.92 ELSE POWER((bl+0.055)/1.055, 2.4) END;

  -- sRGB -> LMS (OKLab)
  lms_l := 0.4122214708*rl + 0.5363325363*gl + 0.0514459929*blin;
  lms_m := 0.2119034982*rl + 0.6806995451*gl + 0.1073969566*blin;
  lms_s := 0.0883024619*rl + 0.2817188376*gl + 0.6299787005*blin;

  l_ := CBRT(lms_l);
  m_ := CBRT(lms_m);
  s_ := CBRT(lms_s);

  L :=  0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
  a :=  1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
  b :=  0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
  RETURN NEXT;
END;
$$;

-- Function to find closest product matches using OKLab color distance
CREATE OR REPLACE FUNCTION public.find_closest_product_matches(
  user_hex TEXT, 
  match_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  brand TEXT,
  product TEXT,
  name TEXT,
  hex TEXT,
  color_distance DOUBLE PRECISION,
  url TEXT,
  imgSrc TEXT,
  description TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  WITH user_oklab AS (
    SELECT L, a, b FROM public.hex_to_oklab(user_hex)
  ),
  product_distances AS (
    SELECT 
      p.brand,
      p.product,
      p.name,
      p.hex,
      p.url,
      p.imgSrc,
      p.description,
      SQRT(
        POWER(u.L - prod.L, 2) + 
        POWER(u.a - prod.a, 2) + 
        POWER(u.b - prod.b, 2)
      ) as distance
    FROM public.alphabeticalproductsbyhex p
    CROSS JOIN user_oklab u
    CROSS JOIN LATERAL public.hex_to_oklab(p.hex) AS prod(L, a, b)
    WHERE p.hex IS NOT NULL AND p.hex != ''
  )
  SELECT 
    pd.brand,
    pd.product,
    pd.name,
    pd.hex,
    pd.distance,
    pd.url,
    pd.imgSrc,
    pd.description
  FROM product_distances pd
  ORDER BY pd.distance ASC
  LIMIT match_limit;
END;
$$;