
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analytics_rw') THEN
    CREATE ROLE analytics_rw NOLOGIN BYPASSRLS PASSWORD 'placeholder_will_be_rotated';
  ELSE
    ALTER ROLE analytics_rw BYPASSRLS;
  END IF;
END$$;

GRANT USAGE ON SCHEMA public TO analytics_rw;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO analytics_rw;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO analytics_rw;

-- Defaults for objects created by the current migration role
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO analytics_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO analytics_rw;
