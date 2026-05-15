import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";
const APP_URL = "https://apnea-mate-pro.com";

const ctaButton = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block; background:#3f66e8; color:#ffffff; font-size:15px; font-weight:bold; border-radius:18px; padding:14px 28px; text-decoration:none; margin:16px 0;">
    ${label}
  </a>
`;

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, groupId, userId, ownerId, requesterId }: GroupNotificationRequest = await req.json();

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

    // Recipient is the owner for request_received, otherwise the requester (userId)
    const recipientUserId = type === "request_received" ? ownerId : userId;

    if (!recipientUserId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient user id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch recipient profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("user_id", recipientUserId)
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
          <img src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png" alt="Apnea Mate" width="180" style="display:block;margin:0 0 20px;height:auto;" />
          <h2 style="color: #16a34a;">Benvenuto nel gruppo! 🎉</h2>
          <p>Ciao ${userProfile.name}!</p>
          <p>La tua richiesta di partecipazione è stata <strong>approvata</strong>!</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 8px; color: #166534;">${group.name}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${group.location}</p>
          </div>
          <p>Ora puoi vedere le sessioni del gruppo e partecipare alle attività!</p>
          ${ctaButton(`${APP_URL}/groups/${groupId}`, "Vai al gruppo")}
          <p style="color: #64748b; font-size: 14px;">Buone immersioni! 🌊<br/>— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "request_received") {
      // Fetch requester profile for the email body
      let requesterName = "Un freediver";
      if (requesterId) {
        const { data: requesterProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", requesterId)
          .single();
        if (requesterProfile?.name) requesterName = requesterProfile.name;
      }

      subject = `Nuova richiesta di adesione a "${group.name}"`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png" alt="Apnea Mate" width="180" style="display:block;margin:0 0 20px;height:auto;" />
          <h2 style="color: #3f66e8;">Nuova richiesta di adesione 🤿</h2>
          <p>Ciao ${userProfile.name},</p>
          <p><strong>${requesterName}</strong> ha richiesto di unirsi al tuo gruppo:</p>
          <div style="background: #eff6ff; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #3f66e8;">
            <h3 style="margin: 0 0 8px; color: #1e3a8a;">${group.name}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${group.location}</p>
          </div>
          <p>Vai al gruppo per approvare o rifiutare la richiesta.</p>
          ${ctaButton(`${APP_URL}/groups/${groupId}/manage`, "Gestisci richieste")}
          <p style="color: #64748b; font-size: 14px;">— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "request_rejected") {
      subject = `Richiesta per "${group.name}" non approvata`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png" alt="Apnea Mate" width="180" style="display:block;margin:0 0 20px;height:auto;" />
          <h2 style="color: #dc2626;">Richiesta non approvata</h2>
          <p>Ciao ${userProfile.name},</p>
          <p>Purtroppo la tua richiesta di partecipazione al gruppo non è stata approvata:</p>
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 8px; color: #991b1b;">${group.name}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${group.location}</p>
          </div>
          <p>Non preoccuparti, ci sono tanti altri gruppi disponibili nella community!</p>
          ${ctaButton(`${APP_URL}/community`, "Esplora gruppi")}
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
