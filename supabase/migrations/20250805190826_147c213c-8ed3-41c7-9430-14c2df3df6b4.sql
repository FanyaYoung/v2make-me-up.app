-- Fix RLS policy performance issues by consolidating policies and optimizing auth calls

-- Drop conflicting policies for multiple_permissive_policies warnings
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.test_updated_at;

-- Re-create optimized policies with (select auth.uid()) wrapping
ALTER POLICY "Users can view their own profiles" ON public.profiles
USING ((select auth.uid()) = id);

ALTER POLICY "Users can update their own profiles" ON public.profiles  
USING ((select auth.uid()) = id);

ALTER POLICY "Users can insert their own profiles" ON public.profiles
WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users can view face regions from their sessions" ON public.face_regions
USING (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = face_regions.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

ALTER POLICY "Users can insert face regions for their sessions" ON public.face_regions
WITH CHECK (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = face_regions.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

ALTER POLICY "Users can view their foundation matches" ON public.foundation_matches
USING (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = foundation_matches.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

ALTER POLICY "Users can insert foundation matches for their sessions" ON public.foundation_matches
WITH CHECK (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = foundation_matches.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

ALTER POLICY "Users can view their own feedback" ON public.foundation_feedback
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can insert their own feedback" ON public.foundation_feedback
WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can view their own orders" ON public.orders
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can view their own order items" ON public.order_items
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = (select auth.uid())
));

ALTER POLICY "Users can manage their own search history" ON public.search_history
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can manage their own favorites" ON public.user_favorites
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can view their own match usage" ON public.user_match_usage
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can insert their own match usage" ON public.user_match_usage
WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can view their own activity" ON public.user_activity
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can view their own analytics" ON public.user_analytics  
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can view public ideas or their own" ON public.user_ideas
USING ((is_public = true) OR ((select auth.uid()) = user_id));

ALTER POLICY "Users can manage their own ideas" ON public.user_ideas
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can only access their own rows" ON public.test_updated_at
USING (user_id = (select auth.uid()));

ALTER POLICY "select_own_subscription" ON public.subscribers
USING ((user_id = (select auth.uid())) OR (email = (select auth.email())));

ALTER POLICY "select_own_subscription" ON public.subscription_data  
USING ((user_id = (select auth.uid())) OR (email = (select auth.email())));

ALTER POLICY "Users can manage their own scan sessions" ON public.scan_sessions
USING ((select auth.uid()) = user_id);