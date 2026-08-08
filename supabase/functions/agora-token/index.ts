// Supabase Edge Function: agora-token
// Generates an Agora RTC token for joining a channel.
//
// Deploy:
//   npx supabase functions deploy agora-token
//
// Environment secrets (set in Supabase dashboard -> Edge Functions -> Secrets):
//   AGORA_APP_ID
//   AGORA_APP_CERTIFICATE
//   AGORA_EXPIRE_SECONDS  (optional, default 3600)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const APP_ID = Deno.env.get("AGORA_APP_ID") || "";
const APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE") || "";
const EXPIRE_SECONDS = Number(Deno.env.get("AGORA_EXPIRE_SECONDS") || 3600);

// ---- Binary helpers (Agora access token v2 format) ----
function packUint32(num: number): Uint8Array {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, num >>> 0, false);
  return buf;
}
function packUint16(num: number): Uint8Array {
  const buf = new Uint8Array(2);
  new DataView(buf.buffer).setUint16(0, num >>> 0, false);
  return buf;
}
function packString(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str);
  const out = new Uint8Array(2 + bytes.length);
  out.set(packUint16(bytes.length), 0);
  out.set(bytes, 2);
  return out;
}
function packBuffer(buf: Uint8Array): Uint8Array {
  const out = new Uint8Array(2 + buf.length);
  out.set(packUint16(buf.length), 0);
  out.set(buf, 2);
  return out;
}
function concatU8(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}
function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function aesCbcEncrypt(key: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(key),
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  // PKCS#7 padding to 16-byte block
  const blockSize = 16;
  const padLen = blockSize - (plaintext.length % blockSize);
  const padded = new Uint8Array(plaintext.length + padLen);
  padded.set(plaintext);
  padded.fill(padLen, plaintext.length);

  const iv = new Uint8Array(16); // zero IV per Agora spec
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    toArrayBuffer(padded)
  );
  return new Uint8Array(encrypted);
}

async function signToken(
  appId: string,
  certificate: string,
  channelName: string,
  uid: number,
  expire: number,
  salt: number,
  ts: number
): Promise<string> {
  const content = concatU8(
    packString(appId),
    packUint32(ts),
    packUint32(expire),
    packUint32(uid >>> 0),
    packUint32(salt),
    packString(channelName),
    packUint32(0), // privileges (none)
    packUint16(0) // message count
  );

  const certBytes = new TextEncoder().encode(certificate);
  const key = concatU8(certBytes, packUint32(salt));
  const encrypted = await aesCbcEncrypt(key, content);

  const token = concatU8(
    packString("006"),
    packUint32(ts),
    packUint32(expire),
    packUint32(salt),
    packUint32(uid >>> 0),
    packUint32(0),
    packBuffer(encrypted)
  );

  return base64UrlEncode(token);
}

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
    const uid = Number(body?.uid) || 0;

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

    const ts = Math.floor(Date.now() / 1000);
    const salt = Math.floor(Math.random() * 0xffffffff);
    const token = await signToken(APP_ID, APP_CERTIFICATE, channelName, uid, EXPIRE_SECONDS, salt, ts);

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
