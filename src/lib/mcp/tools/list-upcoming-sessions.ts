import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_upcoming_sessions",
  title: "List my upcoming sessions",
  description:
    "List Apnea Mate sessions the signed-in user has joined (as organizer or participant) that are scheduled in the future.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max sessions to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const nowIso = new Date().toISOString();

    const { data: parts, error: partsErr } = await sb
      .from("session_participants")
      .select("session_id")
      .eq("user_id", userId)
      .is("cancelled_at", null);
    if (partsErr) return { content: [{ type: "text", text: partsErr.message }], isError: true };
    const joinedIds = (parts ?? []).map((p) => p.session_id);

    let query = sb
      .from("sessions")
      .select("id,title,date_time,duration_minutes,session_type,level,is_paid,spot_id,group_id,creator_id,status")
      .gte("date_time", nowIso)
      .order("date_time", { ascending: true })
      .limit(limit ?? 20);

    if (joinedIds.length > 0) {
      query = query.or(`creator_id.eq.${userId},id.in.(${joinedIds.join(",")})`);
    } else {
      query = query.eq("creator_id", userId);
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});