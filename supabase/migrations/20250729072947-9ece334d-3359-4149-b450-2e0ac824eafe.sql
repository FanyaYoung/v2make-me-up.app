-- Add Amazon affiliate data to existing brands
INSERT INTO public.brand_referral_codes (brand_id, affiliate_code, referral_url, commission_rate, is_active)
SELECT 
  b.id,
  'AMAZON_' || UPPER(REPLACE(b.name, ' ', '_')),
  'https://amazon.com/dp/[ASIN]?tag=your-amazon-tag-20',
  4.00,
  true
FROM public.brands b 
WHERE b.name IN ('Maybelline', 'Revlon', 'L''Oreal', 'CoverGirl', 'NYX Professional Makeup')
ON CONFLICT (brand_id, affiliate_code) DO NOTHING;

-- Add Amazon as a purchase option for all major brands
INSERT INTO public.purchase_options (brand_id, option_name, option_type, base_url, requires_referral_code, is_active)
SELECT 
  b.id,
  'Amazon',
  'online',
  'https://amazon.com',
  true,
  true
FROM public.brands b 
WHERE b.name IN ('Maybelline', 'Revlon', 'L''Oreal', 'CoverGirl', 'NYX Professional Makeup', 'Fenty Beauty', 'Rare Beauty')
ON CONFLICT (brand_id, option_name) DO NOTHING;

-- Add pending affiliate placeholders for approved brands
INSERT INTO public.brand_referral_codes (brand_id, affiliate_code, referral_url, commission_rate, is_active)
SELECT 
  b.id,
  CASE 
    WHEN b.name = 'Fenty Beauty' THEN 'FENTY_DIRECT'
    WHEN b.name ILIKE '%Ulta%' THEN 'ULTA_AFFILIATE'
    WHEN b.name ILIKE '%Sephora%' THEN 'SEPHORA_AFFILIATE'
    WHEN b.name ILIKE '%Makeup Forever%' THEN 'MUFE_AFFILIATE'
    ELSE 'PENDING_' || UPPER(REPLACE(b.name, ' ', '_'))
  END,
  CASE 
    WHEN b.name = 'Fenty Beauty' THEN 'https://fentybeauty.com?ref=your-affiliate-id'
    ELSE 'https://pending-approval.com'
  END,
  CASE 
    WHEN b.name = 'Fenty Beauty' THEN 5.00
    WHEN b.name ILIKE '%Ulta%' THEN 3.00
    WHEN b.name ILIKE '%Sephora%' THEN 4.00
    ELSE 4.00
  END,
  CASE 
    WHEN b.name = 'Fenty Beauty' THEN true
    ELSE false  -- Set to false until approval
  END
FROM public.brands b 
WHERE b.name IN ('Fenty Beauty', 'Rare Beauty')
ON CONFLICT (brand_id, affiliate_code) DO NOTHING;

-- Create affiliate tracking table for analytics
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID,
  brand_name TEXT NOT NULL,
  retailer_name TEXT NOT NULL,
  affiliate_code TEXT,
  click_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  purchase_confirmed BOOLEAN DEFAULT false,
  commission_earned NUMERIC,
  session_data JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate clicks
CREATE POLICY "Users can view their own clicks" ON public.affiliate_clicks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert clicks" ON public.affiliate_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update clicks" ON public.affiliate_clicks
FOR UPDATE
USING (true);