import { supabase } from "@/integrations/supabase/client";

export type LogbookXlsxType = "register" | "libretti" | "libretto";

export interface LogbookXlsxRequest {
  type: LogbookXlsxType;
  id?: string;
  group_id?: string;
  filename?: string;
}

/** Calls the edge function, receives raw XLSX bytes and triggers a download. */
export async function downloadLogbookXlsx(req: LogbookXlsxRequest): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("not_authenticated");

  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  const url = `https://${projectRef}.supabase.co/functions/v1/generate-logbook-xlsx`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: req.type, id: req.id, group_id: req.group_id }),
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
  a.download = req.filename ?? "logbook.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
