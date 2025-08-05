-- Remove unused indexes (Part 1) - Foundation and shade related
DROP INDEX IF EXISTS public.idx_foundation_shades_undertone;
DROP INDEX IF EXISTS public.idx_shade_matches_shade_1;
DROP INDEX IF EXISTS public.idx_shade_matches_shade_2;
DROP INDEX IF EXISTS public.idx_foundation_matches_session_id;
DROP INDEX IF EXISTS public.idx_foundation_matches_product_id;
DROP INDEX IF EXISTS public.idx_foundation_feedback_user_id;
DROP INDEX IF EXISTS public.idx_foundation_feedback_foundation_id;