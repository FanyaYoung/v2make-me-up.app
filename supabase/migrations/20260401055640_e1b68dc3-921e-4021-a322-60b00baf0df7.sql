CREATE OR REPLACE FUNCTION public.update_saved_matches_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_hex_catalog_for_user(p_some_check uuid)
  RETURNS TABLE(brand text, product text, name text, hex text, url text, imgsrc text, description text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $function$
BEGIN
  PERFORM 1
    FROM user_organizations uo
   WHERE uo.user_id = (SELECT auth.uid())
     AND uo.organization_id = p_some_check;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  SELECT h.brand, h.product, h.name, h.hex, h.url, h.imgsrc, h.description
    FROM hex_catalog h
   WHERE true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_hex_catalog()
  RETURNS TABLE(brand text, product text, name text, hex text, url text, imgsrc text, description text)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = 'public'
AS $function$
  SELECT brand, product, name, hex, url, "imgSrc" AS imgsrc, categories AS description
  FROM productsandshadeswithimages
  WHERE hex IS NOT NULL AND hex <> '';
$function$;