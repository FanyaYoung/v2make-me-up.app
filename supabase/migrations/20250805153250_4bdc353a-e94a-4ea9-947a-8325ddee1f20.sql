-- Fix database performance issues identified by linter

-- 1. Add indexes for unindexed foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foundation_matches_region_id ON public.foundation_matches(region_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foundation_matches_shade_id ON public.foundation_matches(shade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_availability_shade_id ON public.product_availability(shade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_availability_store_id ON public.product_availability(store_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_categories_parent_category_id ON public.product_categories(parent_category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_updated_at_user_id ON public.test_updated_at(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_match_usage_user_id ON public.user_match_usage(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_virtual_try_on_sessions_product_id ON public.virtual_try_on_sessions(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_virtual_try_on_sessions_shade_id ON public.virtual_try_on_sessions(shade_id);

-- 2. Add primary keys to tables that don't have them
-- Note: For tables with existing data, we need to be careful about adding primary keys
-- Adding a UUID primary key to tables without existing primary keys

-- Add primary key to cleaned makeup products
ALTER TABLE public."cleaned makeup products" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Only add primary key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'cleaned makeup products' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."cleaned makeup products" ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Add primary key to golden_and_adversarial_mst-e_image_ids
ALTER TABLE public."golden_and_adversarial_mst-e_image_ids" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'golden_and_adversarial_mst-e_image_ids' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."golden_and_adversarial_mst-e_image_ids" ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Add primary key to mst-e_image_details
ALTER TABLE public."mst-e_image_details" 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'mst-e_image_details' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public."mst-e_image_details" ADD PRIMARY KEY (id);
    END IF;
END $$;