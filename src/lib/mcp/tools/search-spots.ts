import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_spots",
  title: "Search dive spots",
  description:
    "Search Apnea Mate dive spots by name or location substring. Returns spot metadata including coordinates and environment type.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against spot name or location."),
    limit: z.number().int().min(1).max(50).optional().describe("Max spots to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const like = `%${query.replace(/[%_]/g, "")}%`;
    const { data, error } = await supabaseForUser(ctx)
      .from("spots")
      .select("id,name,location,environment_type,latitude,longitude,description")
      .or(`name.ilike.${like},location.ilike.${like}`)
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { spots: data ?? [] },
    };
  },
});