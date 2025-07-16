-- Enhance profiles table for TrueMatch AI features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS ethnicity JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lineage JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS face_shape TEXT,
ADD COLUMN IF NOT EXISTS skin_concerns TEXT[],
ADD COLUMN IF NOT EXISTS preferred_coverage TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS preferred_finish TEXT DEFAULT 'natural';

-- Create scan sessions table
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  environment_lighting TEXT,
  calibration_completed BOOLEAN DEFAULT false,
  calibration_data JSONB DEFAULT '{}',
  photo_urls TEXT[],
  analysis_complete BOOLEAN DEFAULT false,
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create face regions table for zone-based analysis
CREATE TABLE IF NOT EXISTS public.face_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL, -- 'center', 'perimeter', 'forehead', 'cheek', 'jawline'
  region_coordinates JSONB, -- store coordinate data for the region
  avg_lab_values JSONB, -- {L: number, a: number, b: number}
  avg_rgb_values JSONB, -- {r: number, g: number, b: number}
  hex_color TEXT,
  undertone TEXT,
  depth_level INTEGER,
  confidence_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create enhanced foundation matches table
CREATE TABLE IF NOT EXISTS public.foundation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.face_regions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.foundation_products(id),
  shade_id UUID REFERENCES public.foundation_shades(id),
  match_type TEXT DEFAULT 'primary', -- 'primary', 'secondary', 'cross-brand'
  confidence_score FLOAT DEFAULT 0.0,
  delta_e_value FLOAT, -- Color difference metric
  purchase_url TEXT,
  price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scan_sessions
CREATE POLICY "Users can manage their own scan sessions" ON public.scan_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for face_regions
CREATE POLICY "Users can view face regions from their sessions" ON public.face_regions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_sessions 
      WHERE id = face_regions.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert face regions for their sessions" ON public.face_regions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_sessions 
      WHERE id = face_regions.session_id 
      AND user_id = auth.uid()
    )
  );

-- Create RLS policies for foundation_matches
CREATE POLICY "Users can view their foundation matches" ON public.foundation_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scan_sessions 
      WHERE id = foundation_matches.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert foundation matches for their sessions" ON public.foundation_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_sessions 
      WHERE id = foundation_matches.session_id 
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON public.scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_face_regions_session_id ON public.face_regions(session_id);
CREATE INDEX IF NOT EXISTS idx_foundation_matches_session_id ON public.foundation_matches(session_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_scan_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_sessions_updated_at();