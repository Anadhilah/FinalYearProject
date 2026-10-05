import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ success: false, message: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ success: false, message: "Account service is not configured." }, 500);
  }

  try {
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return json({ success: false, message: "You must be signed in." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: recruiter, error: recruiterError } = await admin
      .from("User")
      .select("role, recruiterStatus, isApproved, company")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (recruiterError) return json({ success: false, message: "Could not verify the recruiter account." }, 500);
    const role = String(recruiter?.role || "").toUpperCase();
    const status = String(recruiter?.recruiterStatus || "").toUpperCase();
    const approved = status === "APPROVED" || (!status && recruiter?.isApproved === true);
    if (role !== "RECRUITER" || !approved) {
      return json({ success: false, message: "Only an approved recruiter can create Company Supervisor accounts." }, 403);
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (name.length < 2) return json({ success: false, message: "Full name is required." }, 400);
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ success: false, message: "A valid email is required." }, 400);

    const temporaryPassword = createTemporaryPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { name, role: "SUPERVISOR", companyRecruiterId: authData.user.id },
    });
    if (createError || !created.user) {
      const message = createError?.message || "Could not create the Company Supervisor account.";
      return json({
        success: false,
        message: /already|exists|registered|unique/i.test(message) ? "This email is already registered." : message,
      }, 409);
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin.from("User").upsert({
      id: created.user.id,
      email,
      name,
      role: "SUPERVISOR",
      isApproved: true,
      emailVerified: true,
      mustChangePassword: true,
      company: recruiter.company || null,
      companyRecruiterId: authData.user.id,
      createdAt: now,
      updatedAt: now,
    }, { onConflict: "id" });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ success: false, message: "The account could not be saved." }, 500);
    }

    return json({
      success: true,
      temporaryPassword,
      supervisor: { id: created.user.id, name, email },
    });
  } catch (error) {
    return json({ success: false, message: error instanceof Error ? error.message : "Account creation failed." }, 500);
  }
});