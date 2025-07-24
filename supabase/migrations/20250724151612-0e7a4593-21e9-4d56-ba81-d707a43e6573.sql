-- Create table to store foundation feedback
CREATE TABLE public.foundation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  foundation_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- 'shade_mismatch', 'technical_issue', 'other'
  feedback_category TEXT, -- 'too_light', 'too_dark', 'ashen', 'grey', 'too_olive', 'too_red', 'too_blue', 'virtual_try_on_failed', 'no_new_recommendations'
  comment TEXT,
  rating TEXT NOT NULL, -- 'positive' or 'negative'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foundation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own feedback" 
ON public.foundation_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.foundation_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_foundation_feedback_user_id ON public.foundation_feedback(user_id);
CREATE INDEX idx_foundation_feedback_foundation_id ON public.foundation_feedback(foundation_id);