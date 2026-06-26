// Frontend env helpers. Values are baked at build time via Vite.
// In Lovable, set VITE_SITE_URL and VITE_APP_ENV per project so the same
// codebase behaves differently on staging vs production.

export const APP_ENV =
  (import.meta.env.VITE_APP_ENV as string | undefined) || "production";

export const IS_STAGING = APP_ENV !== "production";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  "https://apneamate.com";
