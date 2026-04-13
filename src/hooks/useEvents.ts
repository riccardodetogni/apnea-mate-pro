import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EventWithDetails {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  max_participants: number;
  is_paid: boolean;
  creator_id: string;
  group_id: string | null;
  is_public: boolean;
  status: string;
  cover_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_url: string | null;
  created_at: string;
  creator_name: string;
  creator_avatar: string | null;
  creator_is_instructor: boolean;
  participant_count: number;
  is_joined: boolean;
  is_pending: boolean;
  days_count: number;
}

async function fetchEvents(userId: string | undefined, groupId?: string) {
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(30);

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data: events, error } = await query;
  if (error) throw error;
  if (!events || events.length === 0) return [];

  const creatorIds = [...new Set(events.map(e => e.creator_id))];
  const eventIds = events.map(e => e.id);

  const [profilesRes, rolesRes, participantsRes] = await Promise.all([
    supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", creatorIds),
    supabase.from("user_roles").select("user_id, role").in("user_id", creatorIds),
    supabase.from("event_participants").select("event_id, user_id, status").in("event_id", eventIds).in("status", ["pending", "confirmed"]),
  ]);

  const profiles: Record<string, { name: string; avatar_url: string | null }> = {};
  profilesRes.data?.forEach(p => { profiles[p.user_id] = p; });

  const instructors = new Set<string>();
  rolesRes.data?.forEach(r => { if (r.role === "instructor" || r.role === "admin") instructors.add(r.user_id); });

  const counts: Record<string, number> = {};
  const userStatus: Record<string, string> = {};
  participantsRes.data?.forEach(p => {
    if (p.status === "confirmed") counts[p.event_id] = (counts[p.event_id] || 0) + 1;
    if (userId && p.user_id === userId) userStatus[p.event_id] = p.status;
  });

  return events.map(e => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      event_type: e.event_type,
      start_date: e.start_date,
      end_date: e.end_date,
      location: e.location,
      latitude: e.latitude,
      longitude: e.longitude,
      max_participants: e.max_participants,
      is_paid: e.is_paid,
      creator_id: e.creator_id,
      group_id: e.group_id,
      is_public: e.is_public,
      status: e.status,
      cover_image_url: e.cover_image_url,
      contact_email: e.contact_email,
      contact_phone: e.contact_phone,
      contact_url: e.contact_url,
      created_at: e.created_at,
      creator_name: profiles[e.creator_id]?.name || "Utente",
      creator_avatar: profiles[e.creator_id]?.avatar_url || null,
      creator_is_instructor: instructors.has(e.creator_id),
      participant_count: counts[e.id] || 0,
      is_joined: userStatus[e.id] === "confirmed",
      is_pending: userStatus[e.id] === "pending",
      days_count: days,
    } as EventWithDetails;
  });
}

export const useEvents = (groupId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: loading, error } = useQuery({
    queryKey: ["events", { userId: user?.id, groupId }],
    queryFn: () => fetchEvents(user?.id, groupId),
  });

  useEffect(() => {
    const channel = supabase
      .channel("event-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_participants" }, () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const joinEvent = async (eventId: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("event_participants")
      .insert({ event_id: eventId, user_id: user.id, status: "pending" });
    return { error };
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    return { error };
  };

  return { events, loading, error: error as Error | null, joinEvent, leaveEvent };
};
