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
  // Supabase provides this privileged key automatically to Edge Functions.
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
    console.info("create-faculty-coordinator auth", {
      userId: authData.user?.id || null,
      email: authData.user?.email || null,
      authError: authError?.message || null,
    });
    if (authError || !authData.user) return json({ success: false, message: "You must be signed in." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    let { data: coordinator, error: profileError } = await admin
      .from("User")
      .select("role, coordinatorStatus, isApproved, institutionId, facultyId, departmentId")
      .eq("id", authData.user.id)
      .maybeSingle();

    // Recover profiles created before the Auth user and public profile IDs
    // were kept aligned, while still requiring the authenticated email.
    if (!coordinator && authData.user.email) {
      const fallback = await admin
        .from("User")
        .select("role, coordinatorStatus, isApproved, institutionId, facultyId, departmentId")
        .eq("email", authData.user.email.toLowerCase())
        .maybeSingle();
      coordinator = fallback.data;
      profileError = fallback.error;
    }

    const role = String(coordinator?.role || "").toUpperCase().replace(/[-\s]+/g, "_");
    const status = String(coordinator?.coordinatorStatus || "").toUpperCase();
    const canManageFacultyCoordinators = status === "APPROVED" || status === "ACTIVE";
    console.info("create-faculty-coordinator profile", {
      profileFound: Boolean(coordinator),
      profileError: profileError?.message || null,
      role,
      status,
      institutionId: coordinator?.institutionId || null,
      facultyId: coordinator?.facultyId || null,
      departmentId: coordinator?.departmentId || null,
    });
    if (profileError) {
      return json({
        success: false,
        message: `The Edge Function admin key cannot read public.User: ${profileError.message}`,
      }, 500);
    }
    if (!coordinator || role !== "DEPARTMENT_COORDINATOR" || !canManageFacultyCoordinators) {
      return json({
        success: false,
        message: `Only an approved Department Coordinator can add Faculty Coordinators. Current profile: role=${role || "missing"}, status=${status || "missing"}, approved=${coordinator?.isApproved === true ? "true" : "false"}.`,
      }, 403);
    }

    let institutionId = coordinator.institutionId;
    let facultyId = coordinator.facultyId;
    let departmentId = coordinator.departmentId;
    let institutionName = "";
    let facultyName = "";
    let departmentName = "";

    if (!institutionId || !facultyId || !departmentId) {
      const { data: request, error: requestError } = await admin
        .from("DepartmentCoordinatorRequest")
        .select("institutionId, facultyId, departmentId, institutionName, facultyName, departmentName")
        .eq("userId", authData.user.id)
        .in("status", ["APPROVED", "ACTIVE"])
        .order("updatedAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!requestError && request) {
        institutionId = institutionId || request.institutionId;
        facultyId = facultyId || request.facultyId;
        departmentId = departmentId || request.departmentId;
        institutionName = request.institutionName || "";
        facultyName = request.facultyName || "";
        departmentName = request.departmentName || "";
      }
    }

    if ((!institutionId || !facultyId || !departmentId) && institutionName && facultyName && departmentName) {
      const normalizedName = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedInstitutionName = normalizedName(institutionName);
      const normalizedFacultyName = normalizedName(facultyName);
      const normalizedDepartmentName = normalizedName(departmentName);
      const institution = await admin
        .from("Institution")
        .select("id, name");
      const matchedInstitution = (institution.data || []).find((item) => normalizedName(item.name) === normalizedInstitutionName);
      institutionId = institutionId || matchedInstitution?.id || null;

      const faculty = institutionId
        ? await admin.from("FacultySchool").select("id, name").eq("institutionId", institutionId)
        : null;
      const matchedFaculty = (faculty?.data || []).find((item) => normalizedName(item.name) === normalizedFacultyName);
      facultyId = facultyId || matchedFaculty?.id || null;

      const department = institutionId
        ? await admin.from("Department").select("id, name, facultyId").eq("institutionId", institutionId)
        : null;
      const matchedDepartment = (department?.data || []).find((item) =>
        normalizedName(item.name) === normalizedDepartmentName &&
        (!facultyId || !item.facultyId || item.facultyId === facultyId)
      );
      departmentId = departmentId || matchedDepartment?.id || null;
    }

    if (!institutionId || !facultyId || !departmentId) {
      return json({ success: false, message: `Your approved request has scope names (${institutionName || "university"} / ${facultyName || "faculty"} / ${departmentName || "department"}) but they could not be matched to reference records. Add or correct those records first.` }, 400);
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
      user_metadata: {
        name,
        role: "FACULTY_COORDINATOR",
        coordinatorStatus: "ACTIVE",
        institutionId,
        facultyId,
        departmentId,
      },
    });

    if (createError || !created.user) {
      const message = createError?.message || "Could not create the Faculty Coordinator account.";
      return json({ success: false, message: /already|exists|registered|unique/i.test(message) ? "This email is already registered." : message }, 409);
    }

    const now = new Date().toISOString();
    const { error: userError } = await admin.from("User").upsert({
      id: created.user.id,
      email,
      name,
      role: "FACULTY_COORDINATOR",
      isApproved: true,
      coordinatorStatus: "ACTIVE",
      mustChangePassword: true,
      emailVerified: true,
      institutionId,
      facultyId,
      departmentId,
      createdAt: now,
      updatedAt: now,
    }, { onConflict: "id" });

    if (userError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ success: false, message: "The account could not be saved." }, 500);
    }

    return json({
      success: true,
      temporaryPassword,
      coordinator: {
        id: created.user.id,
        name,
        email,
        status: "ACTIVE",
        assignedStudents: 0,
      },
    });
  } catch (error) {
    return json({ success: false, message: error instanceof Error ? error.message : "Account creation failed." }, 500);
  }
});
