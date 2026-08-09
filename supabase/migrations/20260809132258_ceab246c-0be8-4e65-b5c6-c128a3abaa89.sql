select cron.schedule(
  'notify-missing-signatures',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://vjvhaegbfjepysptcygz.supabase.co/functions/v1/notify-missing-signatures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);