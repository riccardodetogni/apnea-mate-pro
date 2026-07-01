// Environment-driven email config. Each value can be overridden per project
// via Supabase Edge Function secrets so staging and production behave
// differently without code changes. Fallbacks point at production so the
// code stays safe if a secret is missing.

const env = (k: string, fallback: string) => Deno.env.get(k) || fallback;

export const SITE_NAME = env("SITE_NAME", "Apnea Mate");
export const SITE_URL = env("SITE_URL", "https://apneamate.com");
export const ROOT_DOMAIN = env("EMAIL_FROM_DOMAIN", "apneamate.com");
export const FROM_DOMAIN = env("EMAIL_FROM_DOMAIN", "apneamate.com");
export const SENDER_DOMAIN = env("EMAIL_SENDER_DOMAIN", "apneamate.com");
export const LOGO_URL = env(
  "EMAIL_LOGO_URL",
  "https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png",
);
export const SUPPORT_EMAIL = env("SUPPORT_EMAIL", "support@apneamate.com");
export const APP_PREVIEW_URL = env("APP_PREVIEW_URL", "https://apnea-mate.lovable.app");
