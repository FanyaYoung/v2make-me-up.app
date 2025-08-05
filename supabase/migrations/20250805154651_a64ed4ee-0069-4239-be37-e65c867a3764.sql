-- Remove unused indexes (Part 5) - Session and order related
DROP INDEX IF EXISTS public.idx_scan_sessions_user_id;
DROP INDEX IF EXISTS public.idx_face_regions_session_id;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_order_number;
DROP INDEX IF EXISTS public.idx_orders_affiliate_id;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_skin_tone_references_undertone;