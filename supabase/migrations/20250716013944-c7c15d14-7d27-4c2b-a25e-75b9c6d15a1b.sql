-- Storage bucket 'avatars' already exists, so we'll skip creating it
-- Create storage policies for avatars (these may also already exist, but we'll use IF NOT EXISTS pattern)

-- Enhance profiles table with additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb;

-- Create user_social_profiles table
CREATE TABLE IF NOT EXISTS public.user_social_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'twitter', 'facebook', 'tiktok', 'youtube', etc.
    username TEXT NOT NULL,
    profile_url TEXT,
    follower_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Enable RLS on user_social_profiles
ALTER TABLE public.user_social_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_social_profiles
CREATE POLICY "Users can view public social profiles or their own" 
ON public.user_social_profiles 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own social profiles" 
ON public.user_social_profiles 
FOR ALL 
USING (auth.uid() = user_id);

-- Create user_activity table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'logout', 'shade_match', 'virtual_try_on', 'product_view', 'search', etc.
    activity_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity
CREATE POLICY "Users can view their own activity" 
ON public.user_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (true);

-- Create user_analytics table for aggregated analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_data JSONB DEFAULT '{}'::jsonb,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, metric_name, date_recorded)
);

-- Enable RLS on user_analytics
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for user_analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" 
ON public.user_analytics 
FOR ALL 
WITH CHECK (true);

-- Create user_preferences table for detailed settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'privacy', 'notifications', 'appearance', 'makeup', 'shopping', etc.
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, category, preference_key)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Create user_ideas table for storing user's makeup ideas and inspiration
CREATE TABLE IF NOT EXISTS public.user_ideas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    inspiration_source TEXT, -- 'celebrity', 'social_media', 'magazine', 'original', etc.
    products_used JSONB DEFAULT '[]'::jsonb, -- Array of product IDs and details
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_ideas
ALTER TABLE public.user_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for user_ideas
CREATE POLICY "Users can view public ideas or their own" 
ON public.user_ideas 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own ideas" 
ON public.user_ideas 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id_created_at ON public.user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id_date ON public.user_analytics(user_id, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id_category ON public.user_preferences(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_ideas_user_id_created_at ON public.user_ideas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ideas_public_created_at ON public.user_ideas(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_social_profiles_user_id ON public.user_social_profiles(user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_social_profiles_updated_at
    BEFORE UPDATE ON public.user_social_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ideas_updated_at
    BEFORE UPDATE ON public.user_ideas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();