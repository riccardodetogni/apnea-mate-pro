import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_groups",
  title: "List my groups",
  description: "List Apnea Mate groups the signed-in user is a member of.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: memberships, error: mErr } = await sb
      .from("group_members")
      .select("group_id,role")
      .eq("user_id", ctx.getUserId());
    if (mErr) return { content: [{ type: "text", text: mErr.message }], isError: true };
    const ids = (memberships ?? []).map((m) => m.group_id);
    if (ids.length === 0) {
      return { content: [{ type: "text", text: "[]" }], structuredContent: { groups: [] } };
    }
    const { data, error } = await sb
      .from("groups")
      .select("id,name,description,group_type,activity_type,location,verified")
      .in("id", ids);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { groups: data ?? [] },
    };
  },
});