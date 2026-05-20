import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "join_request" | "request_approved" | "request_rejected";
  eventId: string;
  participantUserId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { type, eventId, participantUserId }: NotificationRequest = await req.json();

    const { data: ev, error: eventError } = await supabase
      .from("events")
      .select("id, title, start_date, end_date, location, creator_id")
      .eq("id", eventId)
      .single();

    if (eventError || !ev) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const fmt = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const eventDate = ev.start_date === ev.end_date ? fmt(ev.start_date) : `${fmt(ev.start_date)} – ${fmt(ev.end_date)}`;

    let templateName: string;
    let recipientUserId: string | undefined;
    const templateData: Record<string, any> = {
      eventTitle: ev.title,
      eventId,
      eventDate,
      eventLocation: ev.location || undefined,
    };

    if (type === "join_request") {
      recipientUserId = ev.creator_id;
      templateName = "event-join-request";
      if (participantUserId) {
        const { data: req } = await supabase.from("profiles").select("name").eq("user_id", participantUserId).single();
        templateData.requesterName = req?.name || "Un freediver";
      }
    } else if (type === "request_approved") {
      recipientUserId = participantUserId;
      templateName = "event-request-approved";
    } else if (type === "request_rejected") {
      recipientUserId = participantUserId;
      templateName = "event-request-rejected";
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (!recipientUserId) {
      return new Response(JSON.stringify({ error: "Missing recipient" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { data: recipient } = await supabase.from("profiles").select("email, name").eq("user_id", recipientUserId).single();
    if (!recipient?.email) {
      return new Response(JSON.stringify({ error: "Recipient email not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    templateData.recipientName = recipient.name;

    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: recipient.email,
        idempotencyKey: `event-${type}-${eventId}-${recipientUserId}`,
        templateData,
      },
    });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-event-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);