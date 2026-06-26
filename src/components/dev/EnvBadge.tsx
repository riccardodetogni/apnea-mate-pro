import { useEffect } from "react";
import { APP_ENV, IS_STAGING } from "@/lib/env";

/**
 * Small fixed badge shown on every page when the app is NOT running in
 * production. Also prepends [STAGING] to document.title and injects a
 * noindex meta tag so search engines don't index non-prod environments.
 */
const EnvBadge = () => {
  useEffect(() => {
    if (!IS_STAGING) return;

    // noindex
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    // title prefix
    const original = document.title;
    if (!original.startsWith("[STAGING]")) {
      document.title = `[STAGING] ${original}`;
    }
  }, []);

  if (!IS_STAGING) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        right: 8,
        zIndex: 9999,
        background: "rgba(234, 179, 8, 0.95)",
        color: "#111",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        padding: "3px 8px",
        borderRadius: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        pointerEvents: "none",
        textTransform: "uppercase",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {APP_ENV}
    </div>
  );
};

export default EnvBadge;
