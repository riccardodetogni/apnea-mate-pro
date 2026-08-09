import { supabase } from "@/integrations/supabase/client";
import { getLocale } from "@/lib/i18n";

export type LogbookPdfType =
  | "dive_log_single"
  | "logbook_all"
  | "register_pack"
  | "register_check"
  | "libretti_all"
  | "libretti_group";

export interface LogbookPdfRequest {
  type: LogbookPdfType;
  id?: string;
  group_id?: string;
  filename?: string;
}

// Client-side helper: calls the edge function, receives raw PDF bytes, and
// triggers a browser download. Throws on non-OK responses.
export async function downloadLogbookPdf(req: LogbookPdfRequest): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("not_authenticated");

  // Personal exports use the app locale; legal exports are forced to Italian
  // server-side regardless of what we send.
  const locale = getLocale() === "en-GB" || getLocale() === "en-US" ? "en" : "it";

  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  const url = `https://${projectRef}.supabase.co/functions/v1/generate-logbook-pdf`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: req.type,
      id: req.id,
      group_id: req.group_id,
      locale,
    }),
  });

  if (!res.ok) {
    let msg = `http_${res.status}`;
    try {
      const j = await res.json();
      msg = j.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = req.filename ?? "logbook.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on next tick so the download starts reliably on iOS Safari.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
