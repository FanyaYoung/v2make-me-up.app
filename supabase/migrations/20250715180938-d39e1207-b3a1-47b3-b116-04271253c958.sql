-- Create user_match_usage table to track match consumption
CREATE TABLE public.user_match_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('virtual_try_on', 'shade_match', 'skin_analysis')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.user_match_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own match usage" 
ON public.user_match_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match usage" 
ON public.user_match_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to get user match statistics (fixed version)
CREATE OR REPLACE FUNCTION public.get_user_match_stats(user_uuid UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_matches_today', (
      SELECT COUNT(*) 
      FROM public.user_match_usage 
      WHERE user_id = user_uuid 
      AND created_at >= CURRENT_DATE
    ),
    'total_matches_this_week', (
      SELECT COUNT(*) 
      FROM public.user_match_usage 
      WHERE user_id = user_uuid 
      AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
    ),
    'total_matches_this_month', (
      SELECT COUNT(*) 
      FROM public.user_match_usage 
      WHERE user_id = user_uuid 
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'total_matches_all_time', (
      SELECT COUNT(*) 
      FROM public.user_match_usage 
      WHERE user_id = user_uuid
    ),
    'average_matches_per_week', (
      SELECT COALESCE(
        ROUND(
          COUNT(*)::NUMERIC / 
          GREATEST(1, EXTRACT(day FROM (CURRENT_DATE - MIN(created_at::date))) / 7.0)
        , 2), 0)
      FROM public.user_match_usage 
      WHERE user_id = user_uuid
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'last_match_date', (
      SELECT MAX(created_at) 
      FROM public.user_match_usage 
      WHERE user_id = user_uuid
    )
  );
$$;