-- Remove unused indexes (Part 2) - User related
DROP INDEX IF EXISTS public.idx_user_reviews_product_id;
DROP INDEX IF EXISTS public.idx_user_reviews_user_id;
DROP INDEX IF EXISTS public.idx_user_reviews_shade_id;
DROP INDEX IF EXISTS public.idx_user_favorites_product_id;
DROP INDEX IF EXISTS public.idx_user_favorites_shade_id;
DROP INDEX IF EXISTS public.idx_user_activity_user_id_created_at;
DROP INDEX IF EXISTS public.idx_user_analytics_user_id_date;
DROP INDEX IF EXISTS public.idx_user_preferences_user_id_category;
DROP INDEX IF EXISTS public.idx_user_ideas_user_id_created_at;
DROP INDEX IF EXISTS public.idx_user_social_profiles_user_id;