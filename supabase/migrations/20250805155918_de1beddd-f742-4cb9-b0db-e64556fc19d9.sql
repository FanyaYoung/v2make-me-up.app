-- Fix multiple_permissive_policies warnings by dropping conflicting policies

-- Fix for public.test_updated_at policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.test_updated_at;
DROP POLICY IF EXISTS "Users can only access their own rows" ON public.test_updated_at;

-- Fix for public.user_activity policies  
DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;

-- Fix for public.user_analytics policies
DROP POLICY IF EXISTS "System can manage analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.user_analytics;

-- Fix for public.user_ideas policies
DROP POLICY IF EXISTS "Users can manage their own ideas" ON public.user_ideas;
DROP POLICY IF EXISTS "Users can view public ideas or their own" ON public.user_ideas;

-- Re-create the essential policies with optimized expressions
CREATE POLICY "Users can manage their own scan sessions" ON public.scan_sessions
FOR ALL TO authenticated 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own profiles" ON public.profiles
FOR SELECT TO authenticated 
USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profiles" ON public.profiles  
FOR UPDATE TO authenticated
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view face regions from their sessions" ON public.face_regions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = face_regions.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

CREATE POLICY "Users can insert face regions for their sessions" ON public.face_regions
FOR INSERT TO authenticated  
WITH CHECK (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = face_regions.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

CREATE POLICY "Users can view their foundation matches" ON public.foundation_matches
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = foundation_matches.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

CREATE POLICY "Users can insert foundation matches for their sessions" ON public.foundation_matches
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM scan_sessions 
  WHERE scan_sessions.id = foundation_matches.session_id 
  AND scan_sessions.user_id = (select auth.uid())
));

CREATE POLICY "Users can view their own feedback" ON public.foundation_feedback
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.foundation_feedback
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own order items" ON public.order_items
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = (select auth.uid())
));

CREATE POLICY "Users can manage their own search history" ON public.search_history
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage their own match usage" ON public.user_match_usage
FOR ALL TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own activity" ON public.user_activity
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "System can insert activity" ON public.user_activity
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own analytics" ON public.user_analytics  
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "System can manage analytics" ON public.user_analytics
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view public ideas or manage their own" ON public.user_ideas
FOR SELECT TO authenticated
USING ((is_public = true) OR ((select auth.uid()) = user_id));

CREATE POLICY "Users can manage their own ideas" ON public.user_ideas
FOR ALL TO authenticated  
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can only access their own rows" ON public.test_updated_at
FOR ALL TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Select own subscription" ON public.subscribers
FOR SELECT TO authenticated
USING ((user_id = (select auth.uid())) OR (email = (select auth.email())));

CREATE POLICY "Select own subscription data" ON public.subscription_data  
FOR SELECT TO authenticated
USING ((user_id = (select auth.uid())) OR (email = (select auth.email())));

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Update own subscription" ON public.subscribers
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Insert subscription data" ON public.subscription_data
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Update own subscription data" ON public.subscription_data
FOR UPDATE TO authenticated
USING (true);