-- Add indexes for unindexed foreign keys (Part 2)
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_test_updated_at_user_id ON public.test_updated_at(user_id);
CREATE INDEX IF NOT EXISTS idx_user_match_usage_user_id ON public.user_match_usage(user_id);