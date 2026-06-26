import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect } from "react";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
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
    .select("user_id, name, last_name, avatar_url")
    .in("user_id", senderIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, { name: p.name, last_name: p.last_name, avatar_url: p.avatar_url }])
  );

  return messages.map((m: any) => {
    const profile = profileMap.get(m.sender_id);
    const senderName = [profile?.name, profile?.last_name]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(" ") || "Utente";
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      edited_at: m.edited_at ?? null,
      deleted_at: m.deleted_at ?? null,
      sender_name: senderName,
      sender_avatar: profile?.avatar_url || null,
      is_mine: m.sender_id === userId,
    };
  });

}

export const useChat = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: loading } = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: () => fetchMessages(conversationId!, user!.id),
    enabled: !!conversationId && !!user,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

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

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!user || !newContent.trim()) return { error: new Error("invalid") };
      const { data, error } = await supabase
        .from("messages")
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString(),
        } as any)
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .is("deleted_at", null)
        .select("id");

      if (!error && data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
      return { error };
    },
    [user, conversationId, queryClient]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) return { error: new Error("not_authenticated") };
      const { data, error } = await supabase
        .from("messages")
        .update({
          content: "",
          deleted_at: new Date().toISOString(),
        } as any)
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .is("deleted_at", null)
        .select("id");

      if (!error && data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
      return { error };
    },
    [user, conversationId, queryClient]
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

  return { messages, loading, sendMessage, editMessage, deleteMessage, markAsRead };
};
