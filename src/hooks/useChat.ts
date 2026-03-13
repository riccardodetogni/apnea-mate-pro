import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
  is_mine: boolean;
}

async function fetchMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !messages) return [];

  // Fetch sender profiles
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, avatar_url")
    .in("user_id", senderIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }])
  );

  return messages.map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    content: m.content,
    created_at: m.created_at,
    sender_name: profileMap.get(m.sender_id)?.name || "Utente",
    sender_avatar: profileMap.get(m.sender_id)?.avatar_url || null,
    is_mine: m.sender_id === userId,
  }));
}

export const useChat = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: loading } = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: () => fetchMessages(conversationId!, user!.id),
    enabled: !!conversationId && !!user,
    refetchInterval: 10000,
  });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !content.trim()) return;

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (!error) {
        // Update last_read_at
        await supabase
          .from("conversation_participants")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);

        queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      return { error };
    },
    [conversationId, user, queryClient]
  );

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [conversationId, user, queryClient]);

  return { messages, loading, sendMessage, markAsRead };
};
