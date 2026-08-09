select cron.schedule(
  'process-chat-email-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vjvhaegbfjepysptcygz.supabase.co/functions/v1/process-chat-email-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);