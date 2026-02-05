import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GroupNotificationRequest {
  type: "request_approved" | "request_rejected";
  groupId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, groupId, userId }: GroupNotificationRequest = await req.json();

    // Fetch group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, location")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      console.error("Group not found:", groupError);
      return new Response(
        JSON.stringify({ error: "Group not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("user_id", userId)
      .single();

    if (!userProfile?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (type === "request_approved") {
      subject = `Sei stato accettato in "${group.name}"! 🎉`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Benvenuto nel gruppo! 🎉</h2>
          <p>Ciao ${userProfile.name}!</p>
          <p>La tua richiesta di partecipazione è stata <strong>approvata</strong>!</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 8px; color: #166534;">${group.name}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${group.location}</p>
          </div>
          <p>Ora puoi vedere le sessioni del gruppo e partecipare alle attività!</p>
          <p style="color: #64748b; font-size: 14px;">Buone immersioni! 🌊<br/>— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "request_rejected") {
      subject = `Richiesta per "${group.name}" non approvata`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Richiesta non approvata</h2>
          <p>Ciao ${userProfile.name},</p>
          <p>Purtroppo la tua richiesta di partecipazione al gruppo non è stata approvata:</p>
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 8px; color: #991b1b;">${group.name}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${group.location}</p>
          </div>
          <p>Non preoccuparti, ci sono tanti altri gruppi disponibili nella community!</p>
          <p style="color: #64748b; font-size: 14px;">— Il team Apnea Mate</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Apnea Mate <${RESEND_FROM_EMAIL}>`,
        to: [userProfile.email],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Group notification email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-group-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
