// Supabase Edge Function: send-email
//
// DORMANT — notifications are currently delivered in-app via the Messages
// system. This function is NOT called by the frontend and NO provider keys
// are configured. It exists so the platform can later turn on transactional
// email (invitation links, approval notices) without rebuilding anything.
//
// When provider secrets are configured (Supabase dashboard -> Edge Functions
// -> Secrets), this function sends mail through the selected provider:
//   EMAIL_PROVIDER   "resend" (default) | "sendgrid"
//   RESEND_API_KEY    (Resend) https://resend.com
//   SENDGRID_API_KEY  (SendGrid) https://sendgrid.com
//   EMAIL_FROM        verified sender, e.g. "InternConnect <no-reply@example.com>"
//
// Until EMAIL_PROVIDER + the matching API key are set, it returns a "not
// configured" response and does NOT attempt to send, so it never leaks or
// pretends an email was delivered.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const to = body?.to as string | undefined;
    const subject = body?.subject as string | undefined;
    const html = body?.html as string | undefined;
    const text = body?.text as string | undefined;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ success: false, message: "to and subject are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only members of this project may use the function (anonymouse access is
    // not granted), but verify the caller is authorized via Supabase JWT.
    const authorization = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    let userId: string | null = null;
    if (authorization && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authorization } },
      });
      const { data: authUser } = await supabase.auth.getUser();
      userId = authUser?.user?.id ?? null;
    }
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = Deno.env.get("EMAIL_PROVIDER") || "resend";
    const from = Deno.env.get("EMAIL_FROM") || "InternConnect <no-reply@internconnect.local>";

    // Dormant stub: no provider configured yet.
    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY") || "";
    const configured =
      (provider === "sendgrid" ? sendgridKey : resendKey) && from ? true : false;

    if (!configured) {
      console.log(`send-email: email for ${to} NOT sent (provider not configured).`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email provider not configured. No email was sent.",
          dormant: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Provider delivery is implemented here once a key is configured.
    if (provider === "sendgrid") {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject: subject,
          content: [{ type: "text/html", value: html || text || "" }],
        }),
      });
      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, message: "SendGrid returned an error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html: html || "", text: text || "" }),
      });
      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, message: "Resend returned an error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email queued.", to }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
