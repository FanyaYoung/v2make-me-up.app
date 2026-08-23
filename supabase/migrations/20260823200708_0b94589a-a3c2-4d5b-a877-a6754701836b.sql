CREATE TABLE public.pricing_alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  alerts_enabled boolean NOT NULL DEFAULT true,
  stale_threshold_hours integer NOT NULL DEFAULT 6,
  stale_ratio_threshold numeric NOT NULL DEFAULT 0.5,
  cooldown_minutes integer NOT NULL DEFAULT 60,
  last_alert_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL DEFAULT 'warning',
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivered boolean NOT NULL DEFAULT false,
  delivery_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pricing_alert_settings TO authenticated;
GRANT ALL ON public.pricing_alert_settings TO service_role;
GRANT SELECT ON public.pricing_alert_events TO authenticated;
GRANT ALL ON public.pricing_alert_events TO service_role;

ALTER TABLE public.pricing_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pricing alert settings"
  ON public.pricing_alert_settings FOR ALL TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins read pricing alert events"
  ON public.pricing_alert_events FOR SELECT TO authenticated
  USING (public.is_admin_user());

CREATE TRIGGER update_pricing_alert_settings_updated_at
  BEFORE UPDATE ON public.pricing_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_alert_settings (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;