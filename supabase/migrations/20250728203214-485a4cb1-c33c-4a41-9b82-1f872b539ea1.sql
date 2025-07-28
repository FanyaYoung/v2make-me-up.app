-- Insert sample brands
INSERT INTO public.brands (id, name, description, logo_url, website_url, brand_tier, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Fenty Beauty', 'Inclusive beauty brand by Rihanna', 'https://example.com/fenty-logo.png', 'https://fentybeauty.com', 'luxury', true),
('550e8400-e29b-41d4-a716-446655440002', 'NARS', 'French cosmetics and skin care company', 'https://example.com/nars-logo.png', 'https://narscosmetics.com', 'luxury', true),
('550e8400-e29b-41d4-a716-446655440003', 'Rare Beauty', 'Beauty brand by Selena Gomez', 'https://example.com/rare-logo.png', 'https://rarebeauty.com', 'mid-range', true),
('550e8400-e29b-41d4-a716-446655440004', 'Charlotte Tilbury', 'Luxury makeup and skincare brand', 'https://example.com/ct-logo.png', 'https://charlottetilbury.com', 'luxury', true),
('550e8400-e29b-41d4-a716-446655440005', 'Maybelline', 'American multinational cosmetics brand', 'https://example.com/maybelline-logo.png', 'https://maybelline.com', 'drugstore', true);

-- Insert sample foundation products
INSERT INTO public.foundation_products (id, brand_id, name, description, price, coverage, finish, is_active, image_url) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Pro Filt''r Soft Matte Longwear Foundation', 'Full coverage, long-wearing foundation', 38.00, 'full', 'matte', true, 'https://example.com/fenty-foundation.jpg'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Natural Radiant Longwear Foundation', 'Medium to full coverage foundation', 50.00, 'medium', 'natural', true, 'https://example.com/nars-foundation.jpg'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Liquid Touch Weightless Foundation', 'Buildable coverage foundation', 32.00, 'medium', 'natural', true, 'https://example.com/rare-foundation.jpg'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Airbrush Flawless Foundation', 'Full coverage airbrushed finish', 46.00, 'full', 'natural', true, 'https://example.com/ct-foundation.jpg'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Fit Me Matte + Poreless Foundation', 'Medium coverage foundation', 8.99, 'medium', 'matte', true, 'https://example.com/maybelline-foundation.jpg');

-- Insert sample foundation shades
INSERT INTO public.foundation_shades (id, product_id, shade_name, shade_code, hex_color, undertone, depth_level, is_available) VALUES
-- Fenty Beauty Pro Filt'r shades
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '100', '100', '#F7E7CE', 'neutral', 1, true),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '150', '150', '#F4D5AE', 'warm', 2, true),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', '200', '200', '#E8C4A0', 'neutral', 3, true),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', '350', '350', '#C19963', 'warm', 5, true),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '450', '450', '#8B5A2B', 'warm', 7, true),

-- NARS Natural Radiant shades
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', 'Finland', 'FINLAND', '#F5E4C1', 'neutral', 1, true),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440002', 'Gobi', 'GOBI', '#E5C2A1', 'warm', 3, true),
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440002', 'Cadiz', 'CADIZ', '#D4A574', 'warm', 4, true),
('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440002', 'Tahoe', 'TAHOE', '#B5925F', 'neutral', 6, true),

-- Rare Beauty Liquid Touch shades
('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440003', '10N', '10N', '#F6E5C8', 'neutral', 1, true),
('750e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440003', '15W', '15W', '#F2D5B0', 'warm', 2, true),
('750e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440003', '25N', '25N', '#E7C49E', 'neutral', 3, true),
('750e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440003', '35W', '35W', '#C99B6C', 'warm', 5, true),

-- Charlotte Tilbury Airbrush shades
('750e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440004', '1 Fair', '1FAIR', '#F7E8D0', 'neutral', 1, true),
('750e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440004', '3 Light', '3LIGHT', '#F0D6B3', 'warm', 2, true),
('750e8400-e29b-41d4-a716-446655440016', '650e8400-e29b-41d4-a716-446655440004', '6 Medium', '6MEDIUM', '#E1B88A', 'neutral', 4, true),

-- Maybelline Fit Me shades
('750e8400-e29b-41d4-a716-446655440017', '650e8400-e29b-41d4-a716-446655440005', '110 Porcelain', '110', '#F5E6CC', 'neutral', 1, true),
('750e8400-e29b-41d4-a716-446655440018', '650e8400-e29b-41d4-a716-446655440005', '128 Warm Nude', '128', '#F1D4B0', 'warm', 2, true),
('750e8400-e29b-41d4-a716-446655440019', '650e8400-e29b-41d4-a716-446655440005', '220 Natural Beige', '220', '#E2C19A', 'neutral', 3, true),
('750e8400-e29b-41d4-a716-446655440020', '650e8400-e29b-41d4-a716-446655440005', '355 Coconut', '355', '#C4976A', 'warm', 5, true);