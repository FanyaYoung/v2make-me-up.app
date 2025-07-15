-- Update the get_user_match_stats function to improve security by setting search path
CREATE OR REPLACE FUNCTION public.get_user_match_stats(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$