import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConversationListItem {
  id: string;
  type: "session" | "group" | "dm";
  session_id: string | null;
  group_id: string | null;
  created_at: string;
  // Derived
  name: string;
  avatarInitial: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

async function fetchConversations(userId: string): Promise<ConversationListItem[]> {
  // Get all conversations where user is a participant
  const { data: participations, error: pError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (pError || !participations?.length) return [];

  const conversationIds = participations.map((p) => p.conversation_id);
  const lastReadMap = new Map(participations.map((p) => [p.conversation_id, p.last_read_at]));

  // Fetch conversations
  const { data: conversations, error: cError } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds);

  if (cError || !conversations) return [];

  // For each conversation, get last message + unread count
  const results: ConversationListItem[] = [];

  for (const conv of conversations) {
    // Last message
    const { data: lastMsgArr } = await supabase
      .from("messages")
      .select("content, created_at, sender_id")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastMsg = lastMsgArr?.[0] || null;
    const lastRead = lastReadMap.get(conv.id);

    // Unread count
    let unreadCount = 0;
    if (lastRead) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .gt("created_at", lastRead)
        .neq("sender_id", userId);
      unreadCount = count || 0;
    } else if (lastMsg) {
      // Never read — count all messages not from self
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId);
      unreadCount = count || 0;
    }

    // Resolve name based on type
    let name = "Chat";
    let avatarInitial = "C";
    let avatarUrl: string | null = null;

    if (conv.type === "session" && conv.session_id) {
      const { data: session } = await supabase
        .from("sessions")
        .select("title")
        .eq("id", conv.session_id)
        .single();
      name = session?.title || "Sessione";
      avatarInitial = name.charAt(0).toUpperCase();
    } else if (conv.type === "group" && conv.group_id) {
      const { data: group } = await supabase
        .from("groups")
        .select("name, avatar_url")
        .eq("id", conv.group_id)
        .single();
      name = group?.name || "Gruppo";
      avatarInitial = name.charAt(0).toUpperCase();
      avatarUrl = group?.avatar_url || null;
    } else if (conv.type === "dm") {
      // Find the other participant
      const { data: otherParticipants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id)
        .neq("user_id", userId);

      if (otherParticipants?.[0]) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("user_id", otherParticipants[0].user_id)
          .single();
        name = profile?.name || "Utente";
        avatarInitial = name.charAt(0).toUpperCase();
        avatarUrl = profile?.avatar_url || null;
      }
    }

    results.push({
      id: conv.id,
      type: conv.type as "session" | "group" | "dm",
      session_id: conv.session_id,
      group_id: conv.group_id,
      created_at: conv.created_at,
      name,
      avatarInitial,
      avatarUrl,
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.created_at || null,
      unreadCount,
    });
  }

  // Sort by last message time (newest first)
  results.sort((a, b) => {
    const aTime = a.lastMessageAt || a.created_at;
    const bTime = b.lastMessageAt || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return results;
}

export const useConversations = () => {
  const { user } = useAuth();

  const { data: conversations = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, loading, totalUnread, refetch };
};

// Helper: get or create a conversation for a session
export const getOrCreateSessionConversation = async (sessionId: string, creatorId: string): Promise<string> => {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("type", "session")
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Ensure user is a participant
    await supabase.from("conversation_participants").upsert({
      conversation_id: existing.id,
      user_id: creatorId,
    }, { onConflict: "conversation_id,user_id" });
    return existing.id;
  }

  const convId = crypto.randomUUID();

  const { error } = await supabase
    .from("conversations")
    .insert({ id: convId, type: "session", session_id: sessionId });

  if (error) {
    // Unique constraint violation — another call created it first, re-fetch
    const { data: retry } = await supabase
      .from("conversations")
      .select("id")
      .eq("session_id", sessionId)
      .eq("type", "session")
      .limit(1)
      .maybeSingle();

    if (retry) {
      await supabase.from("conversation_participants").upsert({
        conversation_id: retry.id,
        user_id: creatorId,
      }, { onConflict: "conversation_id,user_id" });
      return retry.id;
    }
    throw new Error("Failed to create session conversation");
  }

  await supabase.from("conversation_participants").insert({
    conversation_id: convId,
    user_id: creatorId,
  });

  return convId;
};

// Helper: get or create a conversation for a group
export const getOrCreateGroupConversation = async (groupId: string, userId: string): Promise<string> => {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("group_id", groupId)
    .eq("type", "group")
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase.from("conversation_participants").upsert({
      conversation_id: existing.id,
      user_id: userId,
    }, { onConflict: "conversation_id,user_id" });
    return existing.id;
  }

  const convId = crypto.randomUUID();

  const { error } = await supabase
    .from("conversations")
    .insert({ id: convId, type: "group", group_id: groupId });

  if (error) throw new Error("Failed to create group conversation");

  await supabase.from("conversation_participants").insert({
    conversation_id: convId,
    user_id: userId,
  });

  return convId;
};

// Helper: get or create a DM conversation
export const getOrCreateDMConversation = async (currentUserId: string, otherUserId: string): Promise<string> => {
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myConvs?.length) {
    const convIds = myConvs.map((c) => c.conversation_id);

    const { data: dmConvs } = await supabase
      .from("conversations")
      .select("id")
      .in("id", convIds)
      .eq("type", "dm");

    if (dmConvs?.length) {
      for (const dm of dmConvs) {
        const { data: otherP } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", dm.id)
          .eq("user_id", otherUserId)
          .limit(1);

        if (otherP?.length) return dm.id;
      }
    }
  }

  const convId = crypto.randomUUID();

  const { error } = await supabase
    .from("conversations")
    .insert({ id: convId, type: "dm" });

  if (error) throw new Error("Failed to create DM conversation");

  await supabase.from("conversation_participants").insert([
    { conversation_id: convId, user_id: currentUserId },
    { conversation_id: convId, user_id: otherUserId },
  ]);

  return convId;
};
