CREATE TABLE public.viber_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viber_user_id text NOT NULL UNIQUE,
  viber_chat_id text NOT NULL,
  name text,
  avatar text,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.viber_subscriptions TO service_role;

ALTER TABLE public.viber_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role manages viber_subscriptions" ON public.viber_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_viber_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_viber_subscriptions_updated_at
BEFORE UPDATE ON public.viber_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_viber_subscriptions_updated_at();