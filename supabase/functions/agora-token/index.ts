// Supabase Edge Function: agora-token
// Generates an Agora RTC token using Agora's OFFICIAL agora-access-token SDK
// (AccessToken2 / "007" format). This guarantees tokens the Agora SDK accepts.
//
// Deploy:
//   npx supabase functions deploy agora-token
//
// Environment secrets (set in Supabase dashboard -> Edge Functions -> Secrets):
//   AGORA_APP_ID
//   AGORA_APP_CERTIFICATE
//   AGORA_EXPIRE_SECONDS  (optional, default 3600)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { RtcTokenBuilder, RtcRole } from "npm:agora-access-token@2.0.4";

const APP_ID = Deno.env.get("AGORA_APP_ID") || "";
const APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE") || "";
const EXPIRE_SECONDS = Number(Deno.env.get("AGORA_EXPIRE_SECONDS") || 3600);

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const channelName = body?.channelName as string | undefined;
    const uidRaw = body?.uid;
    const uid = typeof uidRaw === "number" ? uidRaw : 0;

    if (!APP_ID || !APP_CERTIFICATE) {
      return new Response(
        JSON.stringify({ success: false, message: "Agora credentials not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!channelName) {
      return new Response(
        JSON.stringify({ success: false, message: "channelName is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const role = RtcRole.PUBLISHER;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + EXPIRE_SECONDS;

    // Build a token for a specific uid (0 = any uid allowed).
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    return new Response(
      JSON.stringify({ success: true, token, appId: APP_ID, uid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
