import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GroupNotificationRequest {
  type: "request_approved" | "request_rejected" | "request_received";
  groupId: string;
  userId?: string;
  ownerId?: string;
  requesterId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { type, groupId, userId, ownerId, requesterId }: GroupNotificationRequest = await req.json();

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, location")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return new Response(JSON.stringify({ error: "Group not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const recipientUserId = type === "request_received" ? ownerId : userId;
    if (!recipientUserId) {
      return new Response(JSON.stringify({ error: "Missing recipient" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { data: recipient } = await supabase.from("profiles").select("email, name").eq("user_id", recipientUserId).single();
    if (!recipient?.email) {
      return new Response(JSON.stringify({ error: "Recipient email not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const templateData: Record<string, any> = {
      recipientName: recipient.name,
      groupName: group.name,
      groupId,
      groupLocation: group.location,
    };

    let templateName: string;
    if (type === "request_received") {
      templateName = "group-request-received";
      if (requesterId) {
        const { data: req } = await supabase.from("profiles").select("name").eq("user_id", requesterId).single();
        templateData.requesterName = req?.name || "Un freediver";
      }
    } else if (type === "request_approved") {
      templateName = "group-request-approved";
    } else if (type === "request_rejected") {
      templateName = "group-request-rejected";
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: recipient.email,
        idempotencyKey: `group-${type}-${groupId}-${recipientUserId}`,
        templateData,
      },
    });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-group-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
