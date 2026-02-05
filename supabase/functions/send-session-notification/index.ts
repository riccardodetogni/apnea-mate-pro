import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, sessionId, participantUserId }: NotificationRequest = await req.json();

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        date_time,
        creator_id,
        spot:spots (name)
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format date
    const sessionDate = new Date(session.date_time).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    let recipientEmail: string;
    let recipientName: string;
    let subject: string;
    let htmlContent: string;

    if (type === "join_request") {
      // Notify the session creator about new join request
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", session.creator_id)
        .single();

      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", participantUserId)
        .single();

      if (!creatorProfile?.email) {
        return new Response(
          JSON.stringify({ error: "Creator email not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = creatorProfile.email;
      recipientName = creatorProfile.name;
      const requesterName = requesterProfile?.name || "Un utente";

      subject = `Nuova richiesta per "${session.title}"`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Nuova richiesta di partecipazione</h2>
          <p>Ciao ${recipientName}!</p>
          <p><strong>${requesterName}</strong> vuole partecipare alla tua sessione:</p>
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #0c4a6e;">${session.title}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${(session.spot as any)?.name || "Spot"}</p>
            <p style="margin: 0; color: #64748b;">📅 ${sessionDate}</p>
          </div>
          <p>Accedi all'app per approvare o rifiutare la richiesta.</p>
          <p style="color: #64748b; font-size: 14px;">— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "request_approved") {
      // Notify participant that their request was approved
      const { data: participantProfile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", participantUserId)
        .single();

      if (!participantProfile?.email) {
        return new Response(
          JSON.stringify({ error: "Participant email not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = participantProfile.email;
      recipientName = participantProfile.name;

      subject = `Sei stato approvato per "${session.title}"! 🎉`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Richiesta approvata! 🎉</h2>
          <p>Ciao ${recipientName}!</p>
          <p>La tua richiesta di partecipazione è stata <strong>approvata</strong>!</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 8px; color: #166534;">${session.title}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${(session.spot as any)?.name || "Spot"}</p>
            <p style="margin: 0; color: #64748b;">📅 ${sessionDate}</p>
          </div>
          <p>Non dimenticare la tua attrezzatura e arriva puntuale!</p>
          <p style="color: #64748b; font-size: 14px;">Buone immersioni! 🌊<br/>— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "request_rejected") {
      // Notify participant that their request was rejected
      const { data: participantProfile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", participantUserId)
        .single();

      if (!participantProfile?.email) {
        return new Response(
          JSON.stringify({ error: "Participant email not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = participantProfile.email;
      recipientName = participantProfile.name;

      subject = `Richiesta non approvata per "${session.title}"`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Richiesta non approvata</h2>
          <p>Ciao ${recipientName},</p>
          <p>Purtroppo la tua richiesta di partecipazione non è stata approvata per questa sessione:</p>
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 8px; color: #991b1b;">${session.title}</h3>
            <p style="margin: 0; color: #64748b;">📍 ${(session.spot as any)?.name || "Spot"}</p>
            <p style="margin: 0; color: #64748b;">📅 ${sessionDate}</p>
          </div>
          <p>Non preoccuparti, ci sono tante altre sessioni disponibili nella community!</p>
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
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-session-notification function:", error);
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
