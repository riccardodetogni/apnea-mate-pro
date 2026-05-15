import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CertificationNotificationRequest {
  type: "approved" | "rejected";
  userId: string;
  newRole?: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { type, userId, newRole, reason }: CertificationNotificationRequest = await req.json();

    const { data: user } = await supabase.from("profiles").select("email, name").eq("user_id", userId).single();
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User email not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const roleLabels: Record<string, string> = { certified: "Freediver Certificato", instructor: "Istruttore" };
    let templateName: string;
    const templateData: Record<string, any> = { recipientName: user.name };

    if (type === "approved") {
      templateName = "certification-approved";
      templateData.roleLabel = roleLabels[newRole || "certified"] || "Freediver Certificato";
      templateData.isInstructor = newRole === "instructor";
    } else if (type === "rejected") {
      templateName = "certification-rejected";
      if (reason) templateData.reason = reason;
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: user.email,
        idempotencyKey: `cert-${type}-${userId}-${Date.now()}`,
        templateData,
      },
    });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, ...data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-certification-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
