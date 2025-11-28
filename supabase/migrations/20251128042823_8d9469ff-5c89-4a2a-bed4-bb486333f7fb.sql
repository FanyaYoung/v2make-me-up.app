-- Create table for saved shade matches
CREATE TABLE IF NOT EXISTS public.saved_shade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Analysis data
  lightest_hex TEXT NOT NULL,
  lightest_rgb JSONB NOT NULL,
  lightest_pigment_mix JSONB NOT NULL,
  
  darkest_hex TEXT NOT NULL,
  darkest_rgb JSONB NOT NULL,
  darkest_pigment_mix JSONB NOT NULL,
  
  -- Matched products (array of product data)
  matched_products JSONB NOT NULL,
  
  -- Optional user notes
  notes TEXT,
  
  -- Photo used for analysis
  photo_url TEXT
);

-- Enable RLS
ALTER TABLE public.saved_shade_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own saved matches
CREATE POLICY "Users can view their own saved matches"
ON public.saved_shade_matches
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved matches
CREATE POLICY "Users can insert their own saved matches"
ON public.saved_shade_matches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved matches
CREATE POLICY "Users can update their own saved matches"
ON public.saved_shade_matches
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own saved matches
CREATE POLICY "Users can delete their own saved matches"
ON public.saved_shade_matches
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_shade_matches_updated_at
BEFORE UPDATE ON public.saved_shade_matches
FOR EACH ROW
EXECUTE FUNCTION update_saved_matches_updated_at();