import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  // Find registers >= 3 days old, still open or with unsigned present participants
  const { data: registers, error: regErr } = await supabase
    .from("dive_registers")
    .select("id, title, register_date, created_by")
    .lte("register_date", cutoffDate)
    .neq("status", "chiuso");

  if (regErr) {
    console.error("registers query failed", regErr);
    return new Response(JSON.stringify({ error: regErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let notified = 0;

  for (const reg of registers ?? []) {
    // Count present participants without signature
    const { data: parts } = await supabase
      .from("dive_register_participants")
      .select("dive_log_id, attendance_status")
      .eq("register_id", reg.id)
      .eq("attendance_status", "present")
      .not("dive_log_id", "is", null);

    const logIds = (parts ?? []).map((p: any) => p.dive_log_id).filter(Boolean);
    if (logIds.length === 0) continue;

    const { data: signed } = await supabase
      .from("dive_log_signatures")
      .select("dive_log_id")
      .in("dive_log_id", logIds);
    const signedSet = new Set((signed ?? []).map((s: any) => s.dive_log_id));
    const missing = logIds.filter((id) => !signedSet.has(id)).length;
    if (missing === 0) continue;

    // Instructor recipients: responsibles + creator
    const { data: resps } = await supabase
      .from("dive_register_responsibles")
      .select("instructor_user_id")
      .eq("register_id", reg.id);
    const recipients = new Set<string>([reg.created_by]);
    for (const r of resps ?? []) recipients.add((r as any).instructor_user_id);

    for (const uid of recipients) {
      // Skip if we already notified today for this register
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", uid)
        .eq("type", "signature_reminder")
        .gte("created_at", since.toISOString())
        .contains("metadata", { register_id: reg.id })
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabase.from("notifications").insert({
        user_id: uid,
        type: "signature_reminder",
        title: "Firme mancanti sul registro",
        message: `Sono passati 3 giorni da "${reg.title}": restano ${missing} partecipanti da firmare.`,
        metadata: { register_id: reg.id, missing },
      });
      notified++;
    }
  }

  return new Response(JSON.stringify({ ok: true, notified }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
