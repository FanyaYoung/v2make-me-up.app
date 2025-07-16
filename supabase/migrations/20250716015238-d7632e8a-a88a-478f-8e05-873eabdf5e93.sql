-- Insert sample brands with proper tiers if they don't exist
INSERT INTO public.brands (name, brand_tier, logo_url, website_url, is_active) VALUES
  ('Maybelline', 'drugstore', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://www.maybelline.com', true),
  ('Revlon', 'drugstore', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://www.revlon.com', true),
  ('Fenty Beauty', 'mid-range', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://fentybeauty.com', true),
  ('Rare Beauty', 'mid-range', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://rarebeauty.com', true),
  ('Chanel', 'luxury', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://www.chanel.com', true),
  ('Giorgio Armani', 'luxury', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop', 'https://www.giorgioarmanibeauty.com', true)
ON CONFLICT (name) DO UPDATE SET
  brand_tier = EXCLUDED.brand_tier,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url;

-- Insert referral codes for the brands
INSERT INTO public.brand_referral_codes (brand_id, affiliate_code, referral_url, promo_code, commission_rate)
SELECT 
  b.id,
  'SHADE_' || UPPER(REPLACE(b.name, ' ', '')),
  b.website_url || '?ref=shadefinder',
  'SAVE10',
  CASE 
    WHEN b.brand_tier = 'drugstore' THEN 3.00
    WHEN b.brand_tier = 'mid-range' THEN 5.00
    WHEN b.brand_tier = 'luxury' THEN 8.00
    ELSE 5.00
  END
FROM public.brands b
WHERE b.name IN ('Maybelline', 'Revlon', 'Fenty Beauty', 'Rare Beauty', 'Chanel', 'Giorgio Armani')
ON CONFLICT (brand_id) DO UPDATE SET
  affiliate_code = EXCLUDED.affiliate_code,
  referral_url = EXCLUDED.referral_url,
  commission_rate = EXCLUDED.commission_rate;

-- Insert purchase options for each brand
INSERT INTO public.purchase_options (brand_id, option_type, option_name, base_url, requires_referral_code)
SELECT b.id, option_type, option_name, base_url, true
FROM public.brands b
CROSS JOIN (
  VALUES 
    ('online', 'Brand Website', ''),
    ('store', 'Sephora', 'https://www.sephora.com'),
    ('store', 'Ulta', 'https://www.ulta.com'),
    ('delivery', 'Instacart', 'https://www.instacart.com')
) AS options(option_type, option_name, base_url)
WHERE b.name IN ('Maybelline', 'Revlon', 'Fenty Beauty', 'Rare Beauty', 'Chanel', 'Giorgio Armani')
ON CONFLICT DO NOTHING;