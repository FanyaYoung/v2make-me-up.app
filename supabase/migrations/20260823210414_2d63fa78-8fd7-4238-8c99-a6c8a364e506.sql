REVOKE ALL ON public.viber_subscriptions FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_viber_subscriptions_updated_at() FROM anon, authenticated;