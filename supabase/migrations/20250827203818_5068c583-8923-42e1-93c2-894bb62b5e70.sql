-- Security Fix Phase 1: Critical RLS Policy Implementation and Function Security

-- 1. Add read-only RLS policies for tables with RLS enabled but no policies

-- Primary Tables - Allow public read access for product data
CREATE POLICY "Allow public read access to primary tables" 
ON "Primary Tables" 
FOR SELECT 
USING (true);

-- SkintoneOvertoneUndertone - Allow public read access
CREATE POLICY "Allow public read access to skin tone overtone undertone" 
ON "SkintoneOvertoneUndertone" 
FOR SELECT 
USING (true);

-- Skintonehexwithswatches - Allow public read access (already has no policies)
CREATE POLICY "Allow public read access to skin tone hex swatches" 
ON "Skintonehexwithswatches" 
FOR SELECT 
USING (true);

-- products_by_pigmentation - Allow public read access
CREATE POLICY "Allow public read access to products by pigmentation" 
ON "products_by_pigmentation" 
FOR SELECT 
USING (true);

-- productsandshadeswithimages - Allow public read access
CREATE POLICY "Allow public read access to products and shades with images" 
ON "productsandshadeswithimages" 
FOR SELECT 
USING (true);

-- sephoraproductsbyskintone - Allow public read access
CREATE POLICY "Allow public read access to sephora products by skin tone" 
ON "sephoraproductsbyskintone" 
FOR SELECT 
USING (true);

-- alphabeticalproductsbyhex - Allow public read access (this is the main table being used for recommendations)
CREATE POLICY "Allow public read access to alphabetical products by hex" 
ON "alphabeticalproductsbyhex" 
FOR SELECT 
USING (true);

-- 2. Fix database function security by updating search_path settings
-- Update existing functions to use SECURITY DEFINER with proper search_path

-- Update log_index_usage function
CREATE OR REPLACE FUNCTION public.log_index_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.index_usage_log (
        index_name,
        table_name,
        idx_scan,
        idx_size
    )
    SELECT
        indexrelid::regclass AS index_name,
        relid::regclass AS table_name,
        idx_scan,
        pg_relation_size(indexrelid) AS idx_size
    FROM pg_stat_user_indexes
    WHERE indexrelid::regclass::text = 'idx_shade_matches_shade_2_id';
END;
$function$;

-- Update update_scan_sessions_updated_at function
CREATE OR REPLACE FUNCTION public.update_scan_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'MU-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

-- Update update_order_updated_at function
CREATE OR REPLACE FUNCTION public.update_order_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update example_function
CREATE OR REPLACE FUNCTION public.example_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Function logic here
  RETURN NEW;
END;
$function$;

-- Update update_user_analysis_updated_at function
CREATE OR REPLACE FUNCTION public.update_user_analysis_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update get_cosmetics_import_stats function
CREATE OR REPLACE FUNCTION public.get_cosmetics_import_stats()
RETURNS TABLE(dataset_name text, total_products bigint, brands_count bigint, product_types_count bigint, categories_count bigint, avg_price numeric, avg_rating numeric)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update link_foundation_products function
CREATE OR REPLACE FUNCTION public.link_foundation_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update match_cosmetics_brands function
CREATE OR REPLACE FUNCTION public.match_cosmetics_brands()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update hex_to_oklab function
CREATE OR REPLACE FUNCTION public.hex_to_oklab(hex text)
RETURNS TABLE(l double precision, a double precision, b double precision)
LANGUAGE plpgsql
SECURITY DEFINER
IMMUTABLE
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update find_closest_product_matches function
CREATE OR REPLACE FUNCTION public.find_closest_product_matches(user_hex text, match_limit integer DEFAULT 10)
RETURNS TABLE(brand text, product text, name text, hex text, color_distance double precision, url text, imgsrc text, description text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update get_user_match_stats function
CREATE OR REPLACE FUNCTION public.get_user_match_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  today_count integer;
  week_count integer;
  month_count integer;
  total_count integer;
  avg_per_week numeric;
  last_match timestamp with time zone;
BEGIN
  -- Get today's matches
  SELECT COUNT(*) INTO today_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= CURRENT_DATE;
  
  -- Get this week's matches
  SELECT COUNT(*) INTO week_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= DATE_TRUNC('week', CURRENT_DATE);
  
  -- Get this month's matches
  SELECT COUNT(*) INTO month_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get total matches
  SELECT COUNT(*) INTO total_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid;
  
  -- Calculate average per week (last 30 days)
  SELECT COALESCE(
    ROUND(
      COUNT(*)::NUMERIC / GREATEST(1, 4), 2
    ), 0) INTO avg_per_week
  FROM public.user_match_usage 
  WHERE user_id = user_uuid
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Get last match date
  SELECT MAX(created_at) INTO last_match
  FROM public.user_match_usage 
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object(
    'total_matches_today', today_count,
    'total_matches_this_week', week_count,
    'total_matches_this_month', month_count,
    'total_matches_all_time', total_count,
    'average_matches_per_week', avg_per_week,
    'last_match_date', last_match
  );
END;
$function$;

-- Update is_admin_user function (already has proper security)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      (preferences->>'role' = 'admin') OR 
      (preferences->>'is_admin' = 'true')
    )
  );
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;