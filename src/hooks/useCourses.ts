import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CourseWithDetails {
  id: string;
  title: string;
  description: string | null;
  course_type: string;
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
}

async function fetchCourses(userId: string | undefined, groupId?: string) {
  let query = supabase
    .from("courses")
    .select("*")
    .eq("status", "active")
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(30);

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data: courses, error } = await query;
  if (error) throw error;
  if (!courses || courses.length === 0) return [];

  const creatorIds = [...new Set(courses.map(c => c.creator_id))];
  const courseIds = courses.map(c => c.id);

  const [profilesRes, rolesRes, participantsRes] = await Promise.all([
    supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", creatorIds),
    supabase.from("user_roles").select("user_id, role").in("user_id", creatorIds),
    supabase.from("course_participants").select("course_id, user_id, status").in("course_id", courseIds).in("status", ["pending", "confirmed"]),
  ]);

  const profiles: Record<string, { name: string; avatar_url: string | null }> = {};
  profilesRes.data?.forEach(p => { profiles[p.user_id] = p; });

  const instructors = new Set<string>();
  rolesRes.data?.forEach(r => { if (r.role === "instructor" || r.role === "admin") instructors.add(r.user_id); });

  const counts: Record<string, number> = {};
  const userStatus: Record<string, string> = {};
  participantsRes.data?.forEach(p => {
    if (p.status === "confirmed") counts[p.course_id] = (counts[p.course_id] || 0) + 1;
    if (userId && p.user_id === userId) userStatus[p.course_id] = p.status;
  });

  return courses.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    course_type: c.course_type,
    start_date: c.start_date,
    end_date: c.end_date,
    location: c.location,
    latitude: c.latitude,
    longitude: c.longitude,
    max_participants: c.max_participants,
    is_paid: c.is_paid,
    creator_id: c.creator_id,
    group_id: c.group_id,
    is_public: c.is_public,
    status: c.status,
    cover_image_url: c.cover_image_url,
    contact_email: c.contact_email,
    contact_phone: c.contact_phone,
    contact_url: c.contact_url,
    created_at: c.created_at,
    creator_name: profiles[c.creator_id]?.name || "Utente",
    creator_avatar: profiles[c.creator_id]?.avatar_url || null,
    creator_is_instructor: instructors.has(c.creator_id),
    participant_count: counts[c.id] || 0,
    is_joined: userStatus[c.id] === "confirmed",
    is_pending: userStatus[c.id] === "pending",
  } as CourseWithDetails));
}

export const useCourses = (groupId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading: loading, error } = useQuery({
    queryKey: ["courses", { userId: user?.id, groupId }],
    queryFn: () => fetchCourses(user?.id, groupId),
  });

  useEffect(() => {
    const channel = supabase
      .channel("course-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "course_participants" }, () => {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const joinCourse = async (courseId: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("course_participants")
      .insert({ course_id: courseId, user_id: user.id, status: "pending" });
    return { error };
  };

  const leaveCourse = async (courseId: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("course_participants")
      .delete()
      .eq("course_id", courseId)
      .eq("user_id", user.id);
    return { error };
  };

  return { courses, loading, error: error as Error | null, joinCourse, leaveCourse };
};
