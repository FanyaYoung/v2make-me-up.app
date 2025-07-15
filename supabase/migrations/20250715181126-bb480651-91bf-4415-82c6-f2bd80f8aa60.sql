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

-- Create function to get user match statistics (simplified version)
CREATE OR REPLACE FUNCTION public.get_user_match_stats(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  today_count integer;
  week_count integer;
  month_count integer;
  total_count integer;
  avg_per_week numeric;
  last_match timestamp with time zone;
BEGIN
  -- Get today's matches
  SELECT COUNT(*) INTO today_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= CURRENT_DATE;
  
  -- Get this week's matches
  SELECT COUNT(*) INTO week_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= DATE_TRUNC('week', CURRENT_DATE);
  
  -- Get this month's matches
  SELECT COUNT(*) INTO month_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid 
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get total matches
  SELECT COUNT(*) INTO total_count
  FROM public.user_match_usage 
  WHERE user_id = user_uuid;
  
  -- Calculate average per week (last 30 days)
  SELECT COALESCE(
    ROUND(
      COUNT(*)::NUMERIC / GREATEST(1, 4), 2
    ), 0) INTO avg_per_week
  FROM public.user_match_usage 
  WHERE user_id = user_uuid
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Get last match date
  SELECT MAX(created_at) INTO last_match
  FROM public.user_match_usage 
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object(
    'total_matches_today', today_count,
    'total_matches_this_week', week_count,
    'total_matches_this_month', month_count,
    'total_matches_all_time', total_count,
    'average_matches_per_week', avg_per_week,
    'last_match_date', last_match
  );
END;
$$;