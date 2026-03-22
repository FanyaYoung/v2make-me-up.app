-- Create table for storing user skin tone analysis results
CREATE TABLE public.user_skin_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT,
  analysis_method TEXT NOT NULL, -- 'camera', 'photo_upload', 'shade_matcher'
  
  -- Lighter and darker face points
  lighter_hex TEXT NOT NULL,
  darker_hex TEXT NOT NULL,
  
  -- Additional tone information
  undertone TEXT,
  overtone TEXT,
  average_hex TEXT,
  
  -- Face region data
  face_regions JSONB DEFAULT '{}',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  
  -- Metadata
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_skin_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for user skin analysis
CREATE POLICY "Users can view their own skin analysis" 
ON public.user_skin_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skin analysis" 
ON public.user_skin_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skin analysis" 
ON public.user_skin_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for storing user recommendations based on skin analysis
CREATE TABLE public.user_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID REFERENCES public.user_skin_analysis(id),
  
  -- Product recommendations
  recommended_products JSONB NOT NULL DEFAULT '[]',
  foundation_matches JSONB NOT NULL DEFAULT '[]',
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL DEFAULT 'foundation',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for user recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.user_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations" 
ON public.user_recommendations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_skin_analysis_user_id ON public.user_skin_analysis(user_id);
CREATE INDEX idx_user_skin_analysis_method ON public.user_skin_analysis(analysis_method);
CREATE INDEX idx_user_recommendations_user_id ON public.user_recommendations(user_id);
CREATE INDEX idx_user_recommendations_analysis_id ON public.user_recommendations(analysis_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_skin_analysis_updated_at
BEFORE UPDATE ON public.user_skin_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_user_analysis_updated_at();

CREATE TRIGGER update_user_recommendations_updated_at
BEFORE UPDATE ON public.user_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_user_analysis_updated_at();;
