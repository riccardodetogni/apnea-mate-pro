import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMe from "./tools/get-me";
import listUpcomingSessions from "./tools/list-upcoming-sessions";
import searchSpots from "./tools/search-spots";
import listMyGroups from "./tools/list-my-groups";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined at build time so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "apnea-mate-mcp",
  title: "Apnea Mate",
  version: "0.1.0",
  instructions:
    "Tools for Apnea Mate, a freediving community app. Use `get_me` for the signed-in user's profile, `list_upcoming_sessions` for their upcoming dive sessions, `search_spots` to find dive spots by name or location, and `list_my_groups` for the groups they belong to.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMe, listUpcomingSessions, searchSpots, listMyGroups],
});