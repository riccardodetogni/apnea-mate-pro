import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "join_request" | "request_approved" | "request_rejected";
  sessionId: string;
  participantUserId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { type, sessionId, participantUserId }: NotificationRequest = await req.json();

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, title, date_time, creator_id, spot:spots(name)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const sessionDate = new Date(session.date_time).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    const spotName = (session.spot as any)?.name || "Spot";

    let templateName: string;
    let recipientUserId: string | undefined;
    const templateData: Record<string, any> = { sessionTitle: session.title, sessionId, spotName, sessionDate };

    if (type === "join_request") {
      recipientUserId = session.creator_id;
      templateName = "session-join-request";
      if (participantUserId) {
        const { data: req } = await supabase.from("profiles").select("name").eq("user_id", participantUserId).single();
        templateData.requesterName = req?.name || "Un freediver";
      }
    } else if (type === "request_approved") {
      recipientUserId = participantUserId;
      templateName = "session-request-approved";
    } else if (type === "request_rejected") {
      recipientUserId = participantUserId;
      templateName = "session-request-rejected";
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
        idempotencyKey: `session-${type}-${sessionId}-${recipientUserId}`,
        templateData,
      },
    });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-session-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
