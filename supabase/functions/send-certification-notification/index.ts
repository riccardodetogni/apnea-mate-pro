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

interface CertificationNotificationRequest {
  type: "approved" | "rejected";
  userId: string;
  newRole?: string;
  reason?: string;
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

    const { type, userId, newRole, reason }: CertificationNotificationRequest = await req.json();

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

    const roleLabels: Record<string, string> = {
      certified: "Freediver Certificato",
      instructor: "Istruttore",
    };

    if (type === "approved") {
      const roleLabel = roleLabels[newRole || "certified"] || "Freediver Certificato";
      subject = `Certificazione approvata! 🎉`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Certificazione verificata! 🎉</h2>
          <p>Ciao ${userProfile.name}!</p>
          <p>La tua richiesta di certificazione è stata <strong>approvata</strong>!</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 8px; color: #166534;">Nuovo ruolo: ${roleLabel}</h3>
            <p style="margin: 0; color: #64748b;">Ora hai accesso a funzionalità aggiuntive!</p>
          </div>
          <p>Come ${roleLabel.toLowerCase()}, ora puoi:</p>
          <ul style="color: #64748b;">
            <li>Creare sessioni di apnea</li>
            <li>Gestire partecipanti</li>
            ${newRole === "instructor" ? "<li>Creare gruppi e scuole</li>" : ""}
          </ul>
          <p style="color: #64748b; font-size: 14px;">Buone immersioni! 🌊<br/>— Il team Apnea Mate</p>
        </div>
      `;
    } else if (type === "rejected") {
      subject = `Aggiornamento sulla tua certificazione`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Certificazione non approvata</h2>
          <p>Ciao ${userProfile.name},</p>
          <p>Purtroppo la tua richiesta di certificazione non è stata approvata.</p>
          ${reason ? `
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${reason}</p>
          </div>
          ` : ''}
          <p>Puoi inviare una nuova richiesta con documentazione aggiornata.</p>
          <p>Alcuni suggerimenti:</p>
          <ul style="color: #64748b;">
            <li>Assicurati che il documento sia leggibile</li>
            <li>Verifica che il nome corrisponda al tuo profilo</li>
            <li>Includi un documento valido e non scaduto</li>
          </ul>
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
    console.log("Certification notification email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-certification-notification function:", error);
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
