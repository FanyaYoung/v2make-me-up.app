-- Create referral codes table for affiliate integration
CREATE TABLE IF NOT EXISTS public.brand_referral_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    affiliate_code TEXT,
    referral_url TEXT,
    promo_code TEXT, -- for in-person pickup discounts
    commission_rate DECIMAL(5,2), -- percentage commission
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(brand_id)
);

-- Enable RLS on brand_referral_codes
ALTER TABLE public.brand_referral_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_referral_codes (public read access for affiliate links)
CREATE POLICY "Anyone can view active referral codes" 
ON public.brand_referral_codes 
FOR SELECT 
USING (is_active = true);

-- Create purchase_options table for different fulfillment methods
CREATE TABLE IF NOT EXISTS public.purchase_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    option_type TEXT NOT NULL, -- 'online', 'store', 'delivery', 'brand_direct'
    option_name TEXT NOT NULL, -- 'Sephora', 'Ulta', 'Brand Website', 'Instacart'
    base_url TEXT,
    requires_referral_code BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_options
ALTER TABLE public.purchase_options ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_options
CREATE POLICY "Anyone can view active purchase options" 
ON public.purchase_options 
FOR SELECT 
USING (is_active = true);

-- Add brand tier column to categorize brands by quality
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS brand_tier TEXT DEFAULT 'mid-range';
-- Options: 'drugstore', 'mid-range', 'luxury'

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_referral_codes_brand_id ON public.brand_referral_codes(brand_id);
CREATE INDEX IF NOT EXISTS idx_purchase_options_brand_id ON public.purchase_options(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_tier ON public.brands(brand_tier);

-- Insert sample referral codes for common brands
INSERT INTO public.brand_referral_codes (brand_id, affiliate_code, referral_url, promo_code, commission_rate) 
SELECT id, 'SHADE_FINDER_' || UPPER(REPLACE(name, ' ', '_')), website_url, 'SAVE10', 5.00 
FROM public.brands 
WHERE name IN ('Maybelline', 'Revlon', 'L''Oreal', 'CoverGirl', 'Fenty Beauty', 'Rare Beauty') 
ON CONFLICT (brand_id) DO NOTHING;

-- Update brand tiers for sample brands
UPDATE public.brands SET brand_tier = 'drugstore' WHERE name IN ('Maybelline', 'Revlon', 'L''Oreal', 'CoverGirl', 'e.l.f.');
UPDATE public.brands SET brand_tier = 'mid-range' WHERE name IN ('Fenty Beauty', 'Rare Beauty', 'Urban Decay', 'Too Faced', 'Tarte');
UPDATE public.brands SET brand_tier = 'luxury' WHERE name IN ('Chanel', 'Dior', 'Giorgio Armani', 'Tom Ford', 'Charlotte Tilbury');