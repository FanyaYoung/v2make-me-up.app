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

-- Create function to get user match statistics
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
          GREATEST(1, EXTRACT(days FROM (CURRENT_DATE - MIN(created_at::date))) / 7.0)
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

-- Create premium user account
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_sso_user
) VALUES (
  gen_random_uuid(),
  'fanya.uxd@gmail.com',
  crypt('test', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"email": "fanya.uxd@gmail.com", "first_name": "Fanya", "last_name": "UXD"}'::jsonb,
  false
);

-- Get the user ID for the premium user
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'fanya.uxd@gmail.com'
)
-- Insert subscriber record for premium account
INSERT INTO public.subscribers (
  user_id,
  email,
  stripe_customer_id,
  subscribed,
  subscription_tier,
  subscription_end,
  created_at,
  updated_at
) 
SELECT 
  id,
  'fanya.uxd@gmail.com',
  'cus_premium_test_account',
  true,
  'yearly',
  now() + INTERVAL '1 year',
  now(),
  now()
FROM new_user;