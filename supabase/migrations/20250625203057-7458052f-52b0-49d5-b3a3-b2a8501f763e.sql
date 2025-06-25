
-- Create custom types for better data integrity
CREATE TYPE public.skin_undertone AS ENUM ('cool', 'warm', 'neutral', 'olive');
CREATE TYPE public.coverage_level AS ENUM ('light', 'medium', 'full', 'buildable');
CREATE TYPE public.finish_type AS ENUM ('matte', 'satin', 'natural', 'dewy', 'radiant');
CREATE TYPE public.skin_type AS ENUM ('dry', 'oily', 'combination', 'sensitive', 'normal');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  skin_tone TEXT,
  undertone skin_undertone,
  skin_type skin_type,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create foundation products table
CREATE TABLE public.foundation_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  coverage coverage_level,
  finish finish_type,
  is_active BOOLEAN DEFAULT true,
  ingredients TEXT[],
  product_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create foundation shades table
CREATE TABLE public.foundation_shades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.foundation_products(id) ON DELETE CASCADE,
  shade_name TEXT NOT NULL,
  shade_code TEXT,
  hex_color TEXT,
  rgb_values INTEGER[3],
  undertone skin_undertone,
  depth_level INTEGER CHECK (depth_level >= 1 AND depth_level <= 10),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shade matches table for cross-brand matching
CREATE TABLE public.shade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shade_1_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  shade_2_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shade_1_id, shade_2_id)
);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.foundation_products(id) ON DELETE CASCADE,
  shade_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id, shade_id)
);

-- Create user reviews table
CREATE TABLE public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.foundation_products(id) ON DELETE CASCADE,
  shade_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  skin_match_rating INTEGER CHECK (skin_match_rating >= 1 AND skin_match_rating <= 5),
  longevity_rating INTEGER CHECK (longevity_rating >= 1 AND longevity_rating <= 5),
  coverage_rating INTEGER CHECK (coverage_rating >= 1 AND coverage_rating <= 5),
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stores table for availability tracking
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chain_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  website_url TEXT,
  store_type TEXT, -- 'physical', 'online', 'both'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product availability table
CREATE TABLE public.product_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.foundation_products(id) ON DELETE CASCADE,
  shade_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  stock_level TEXT, -- 'in_stock', 'low_stock', 'out_of_stock'
  price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, shade_id, store_id)
);

-- Create virtual try-on sessions table
CREATE TABLE public.virtual_try_on_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.foundation_products(id) ON DELETE CASCADE,
  shade_id UUID REFERENCES public.foundation_shades(id) ON DELETE CASCADE,
  photo_url TEXT,
  result_photo_url TEXT,
  match_confidence DECIMAL(3,2),
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create search history table
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT,
  search_filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_shades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shade_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_try_on_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for public data (brands, products, shades)
CREATE POLICY "Anyone can view brands" ON public.brands
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view foundation products" ON public.foundation_products
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view foundation shades" ON public.foundation_shades
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view shade matches" ON public.shade_matches
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view product availability" ON public.product_availability
  FOR SELECT USING (true);

-- Create RLS policies for user-specific data
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reviews" ON public.user_reviews
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view reviews" ON public.user_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can manage their own virtual try-on sessions" ON public.virtual_try_on_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own search history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_foundation_products_updated_at 
  BEFORE UPDATE ON public.foundation_products 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reviews_updated_at 
  BEFORE UPDATE ON public.user_reviews 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_foundation_products_brand_id ON public.foundation_products(brand_id);
CREATE INDEX idx_foundation_shades_product_id ON public.foundation_shades(product_id);
CREATE INDEX idx_foundation_shades_undertone ON public.foundation_shades(undertone);
CREATE INDEX idx_shade_matches_shade_1 ON public.shade_matches(shade_1_id);
CREATE INDEX idx_shade_matches_shade_2 ON public.shade_matches(shade_2_id);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_reviews_product_id ON public.user_reviews(product_id);
CREATE INDEX idx_product_availability_product_shade ON public.product_availability(product_id, shade_id);
CREATE INDEX idx_virtual_try_on_user_id ON public.virtual_try_on_sessions(user_id);

-- Insert sample data for brands
INSERT INTO public.brands (name, description, website_url) VALUES
  ('Fenty Beauty', 'Inclusive beauty brand by Rihanna', 'https://fentybeauty.com'),
  ('Charlotte Tilbury', 'Luxury makeup and skincare', 'https://charlottetilbury.com'),
  ('Rare Beauty', 'Beauty brand by Selena Gomez', 'https://rarebeauty.com'),
  ('NARS', 'Professional makeup brand', 'https://narscosmetics.com'),
  ('MAC', 'Professional makeup artistry', 'https://maccosmetics.com'),
  ('Too Faced', 'Fun and playful makeup', 'https://toofaced.com'),
  ('Urban Decay', 'Edgy and bold beauty', 'https://urbandecay.com'),
  ('Estée Lauder', 'Luxury skincare and makeup', 'https://esteelauder.com');

-- Insert sample foundation products
INSERT INTO public.foundation_products (brand_id, name, description, price, coverage, finish) 
SELECT 
  b.id,
  'Pro Filt''r Soft Matte Foundation',
  'Long-wearing foundation with soft matte finish',
  36.00,
  'full',
  'matte'
FROM public.brands b WHERE b.name = 'Fenty Beauty';

INSERT INTO public.foundation_products (brand_id, name, description, price, coverage, finish) 
SELECT 
  b.id,
  'Airbrush Flawless Foundation',
  'Full coverage foundation with airbrush finish',
  44.00,
  'full',
  'natural'
FROM public.brands b WHERE b.name = 'Charlotte Tilbury';

INSERT INTO public.foundation_products (brand_id, name, description, price, coverage, finish) 
SELECT 
  b.id,
  'Liquid Touch Weightless Foundation',
  'Weightless foundation with buildable coverage',
  29.00,
  'medium',
  'natural'
FROM public.brands b WHERE b.name = 'Rare Beauty';
