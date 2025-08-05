-- Add indexes for virtual try on sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_virtual_try_on_sessions_product_id ON public.virtual_try_on_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_virtual_try_on_sessions_shade_id ON public.virtual_try_on_sessions(shade_id);