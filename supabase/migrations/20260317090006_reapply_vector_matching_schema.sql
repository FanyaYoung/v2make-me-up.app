-- Reconciliation no-op migration.
-- Schema objects already exist in remote; this file is kept to align migration history.
DO $$
BEGIN
  RAISE NOTICE 'No-op reconciliation migration applied: %', current_setting('application_name', true);
END
$$;
