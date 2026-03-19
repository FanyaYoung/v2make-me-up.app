
-- Recreate hex_catalog view as SECURITY INVOKER
DROP VIEW IF EXISTS public.hex_catalog;
CREATE VIEW public.hex_catalog
WITH (security_invoker = true)
AS
SELECT
  "Brand" AS brand,
  "Product" AS product,
  "Shade Name" AS name,
  "HEX" AS hex,
  NULL::text AS url,
  NULL::text AS imgsrc,
  NULL::text AS description
FROM hex_catelog;
