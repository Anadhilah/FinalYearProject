import { supabase } from "@/lib/supabaseClient";
import { TABLES, STORAGE } from "@/lib/supabaseTables";

/* ============================================================
 * Helpers
 * ============================================================ */

/** Throws a meaningful error when a Supabase query fails. */
function throwIfError(error: { message?: string } | null, fallback: string) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

/**
 * The tables use `id text primary key` with NO default value, so the app must
 * supply an id on insert. This returns a unique id for new rows.
 */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

/** Builds a public URL for a stored file path. */
export function getPublicFileUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE.BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? path;
}

/** Returns a signed URL for a stored file (for private buckets). */
export async function getSignedFileUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE.BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data?.signedUrl ?? path;
}

/** Uploads a file to Supabase Storage and returns the stored path. */
export async function uploadFile(file: File, folder = STORAGE.FOLDER): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(STORAGE.BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
  return path;
}

/* ============================================================
 * Internships
 * ============================================================ */

export interface Internship {
  id: string;
  recruiterId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  type?: string | null;
  duration?: string | null;
  stipend?: string | null;
  requirements?: string | null;
  tags?: string[] | null;
  status?: string | null;
  viewCount?: number | null;
  createdAt?: string | null;
  recruiter?: { name?: string | null; company?: string | null } | null;
  _count?: { applications: number };
}

/** Fetches all internships (optionally filtered by recruiter). */
export async function fetchInternships(recruiterOnly = false): Promise<Internship[]> {
  let query = supabase
    .from(TABLES.INTERNSHIP)
    .select("*, recruiter:recruiterId(name, company)")
    .order("createdAt", { ascending: false });

  if (recruiterOnly) {
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.id) {
      query = query.eq("recruiterId", user.user.id);
    }
  }

  const { data, error } = await query;
  throwIfError(error, "Failed to load internships");
  const internships = (data as Internship[]) || [];

  // Supabase has no built-in `_count` aggregate like Prisma. Compute the
  // application count per internship so the UI's `_count.applications`
  // field is always populated (instead of being undefined/crashing).
  if (internships.length > 0) {
    const ids = internships.map((i) => i.id);
    const { data: appRows, error: appError } = await supabase
      .from(TABLES.APPLICATION)
      .select("internshipId")
      .in("internshipId", ids);
    if (!appError) {
      const counts: Record<string, number> = {};
      for (const row of appRows || []) {
        counts[row.internshipId] = (counts[row.internshipId] || 0) + 1;
      }
      return internships.map((i) => ({
        ...i,
        _count: { applications: counts[i.id] || 0 },
      }));
    }
  }

  return internships;
}

/** Fetches a single internship by id. */
export async function fetchInternshipById(id: string): Promise<Internship | null> {
  const { data, error } = await supabase
    .from(TABLES.INTERNSHIP)
    .select("*, recruiter:recruiterId(name, company)")
    .eq("id", id)
    .single();
  throwIfError(error, "Failed to load internship");
  return (data as Internship) || null;
}

/**
 * Columns that actually exist on the "Internship" table (see supabase/schema.sql).
 * The UI may send extra fields (e.g. `tags`) that are not in the DB schema —
 * including them causes PostgREST to reject the insert with a 400 Bad Request.
 */
const INTERNSHIP_INSERT_COLUMNS = [
  "title",
  "description",
  "location",
  "type",
  "duration",
  "stipend",
  "requirements",
  "status",
] as const;

/** Creates a new internship. */
export async function createInternship(payload: Record<string, unknown>): Promise<Internship> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in to post an internship.");

  // Only forward fields that map to real columns to avoid a 400 on unknown columns.
  const clean: Record<string, unknown> = { status: payload.status || "ACTIVE" };
  for (const col of INTERNSHIP_INSERT_COLUMNS) {
    const value = payload[col];
    if (value !== undefined && value !== null && value !== "") clean[col] = value;
  }

const { data, error } = await supabase
    .from(TABLES.INTERNSHIP)
    .insert({ id: newId(), ...clean, recruiterId: user.user.id, status: clean.status })
    .select()
    .single();
  throwIfError(error, "Failed to create internship");
  return data as Internship;
}

/** Updates an internship. */
export async function updateInternship(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from(TABLES.INTERNSHIP)
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq("id", id);
  throwIfError(error, "Failed to update internship");
}

/** Deletes an internship. */
export async function deleteInternship(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.INTERNSHIP).delete().eq("id", id);
  throwIfError(error, "Failed to delete internship");
}

/* ============================================================
 * Applications
 * ============================================================ */

export interface Application {
  id: string;
  internshipId: string;
  studentId: string;
  status?: string | null;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  createdAt?: string | null;
  internship?: {
    id?: string;
    title?: string | null;
    location?: string | null;
    recruiter?: { name?: string | null; company?: string | null } | null;
  } | null;
  student?: { id?: string; name?: string | null; email?: string | null } | null;
}

/** Fetches applications for the current user (student or recruiter). */
export async function fetchMyApplications(): Promise<Application[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  // Fetch the user's role to decide which query to run.
  const { data: profile } = await supabase
    .from(TABLES.USER)
    .select("role")
    .eq("id", user.user.id)
    .single();

  let query = supabase
    .from(TABLES.APPLICATION)
    .select(
      "*, internship:internshipId(id, title, location, recruiter:recruiterId(name, company)), student:studentId(id, name, email)"
    )
    .order("createdAt", { ascending: false });

  if (profile?.role === "RECRUITER") {
    // Applications attached to internships owned by this recruiter.
    const { data: internships } = await supabase
      .from(TABLES.INTERNSHIP)
      .select("id")
      .eq("recruiterId", user.user.id);
    const ids = (internships || []).map((i) => i.id);
    if (ids.length === 0) return [];
    query = query.in("internshipId", ids);
  } else {
    query = query.eq("studentId", user.user.id);
  }

  const { data, error } = await query;
  throwIfError(error, "Failed to load applications");
  return (data as Application[]) || [];
}

/**
 * Ensures the current user has a row in the "User" table. Child tables
 * (e.g. "Application") have a foreign key to "User", so an insert fails with
 * a 23503 foreign-key violation if the user's profile row is missing (e.g. the
 * signup trigger didn't run). This uses the SECURITY DEFINER RPC which bypasses
 * RLS, falling back to a direct insert if the RPC isn't available.
 *
 * @returns the user's id (throws if the row could not be ensured)
 */
async function ensureUserProfileRow(userId: string): Promise<string> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  if (!authUser?.email) return userId;

  const metaRole =
    (authUser.app_metadata?.role as string | undefined) ??
    (authUser.user_metadata?.role as string | undefined) ??
    "STUDENT";
  const name =
    typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : authUser.email.split("@")[0] ?? "User";
  const now = new Date().toISOString();

  // 0) If a row already exists for this auth id, we're done.
  const { data: existing } = await supabase
    .from(TABLES.USER)
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing?.id) return userId;

  // 0b) The account email may already exist in "User" under a DIFFERENT id
  // (e.g. the auth user and the User row drifted apart). In that case the
  // unique email constraint blocks a fresh insert, and the FK needs a row
  // with THIS auth id. Reconcile by pointing the existing row at this id.
  const { data: existingByEmail } = await supabase
    .from(TABLES.USER)
    .select("id")
    .eq("email", authUser.email)
    .maybeSingle();
  if (existingByEmail?.id && existingByEmail.id !== userId) {
    const { error: reconcileError } = await supabase
      .from(TABLES.USER)
      .update({ id: userId, updatedAt: now })
      .eq("id", existingByEmail.id);
    if (reconcileError) {
      // eslint-disable-next-line no-console
      console.error("Failed to reconcile user id by email:", reconcileError);
    } else {
      // eslint-disable-next-line no-console
      console.info(
        `Reconciled existing User row (old id ${existingByEmail.id}) to auth id ${userId}.`
      );
      return userId;
    }
  }

  // 1) Try the SECURITY DEFINER RPC (bypasses RLS).
  try {
    const { error } = await supabase.rpc("ensure_user_profile", {
      p_id: userId,
      p_email: authUser.email,
      p_name: name,
      p_role: metaRole,
      p_is_approved: false,
      p_email_verified: authUser.email_confirmed_at != null,
      p_recruiter_status: null,
      p_company: null,
      p_industry: null,
      p_registration_number: null,
      p_proof_doc_url: null,
    });
    if (!error) {
      // Verify the row actually exists now.
      const { data: check } = await supabase
        .from(TABLES.USER)
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (check?.id) return userId;
    }
    // eslint-disable-next-line no-console
    console.error("ensure_user_profile RPC failed:", error);
  } catch (rpcErr) {
    // eslint-disable-next-line no-console
    console.error("ensure_user_profile RPC threw:", rpcErr);
  }

  // 2) Fall back to a direct insert (allowed if RLS permits id == auth.uid()).
  const { error: upsertError } = await supabase.from(TABLES.USER).upsert(
    {
      id: userId,
      email: authUser.email,
      name,
      role: metaRole,
      isApproved: false,
      emailVerified: authUser.email_confirmed_at != null,
      recruiterStatus: null,
      company: null,
      industry: null,
      registrationNumber: null,
      proofDocUrl: null,
      createdAt: now,
      updatedAt: now,
    },
    { onConflict: "id" }
  );
  if (upsertError) {
    // eslint-disable-next-line no-console
    console.error("Direct upsert of user profile failed:", upsertError);
    throw new Error(
      `Could not create your profile row in the "User" table. The apply would violate a foreign key that requires a matching User row. ` +
        `This is usually a database setup issue: the app role needs INSERT/GRANT access on the "User" table and the ensure_user_profile function. ` +
        `Run supabase/schema.sql (GRANTS + ensure_user_profile) in the Supabase SQL editor. Underlying error: ${upsertError.message}`
    );
  }

  return userId;
}

/** Creates a new application. */
export async function createApplication(payload: {
  internshipId: string;
  coverLetter?: string;
  resumeUrl?: string;
}): Promise<Application> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in to apply.");

  // Ensure the student's profile row exists so the FK constraint is satisfied.
  await ensureUserProfileRow(user.user.id);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLES.APPLICATION)
    .insert({
      id: newId(),
      ...payload,
      studentId: user.user.id,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Application insert failed:", error);
    throw error;
  }
  return data as Application;
}

/**
 * Normalizes an ApplicationStatus enum value to UPPERCASE.
 * The database enum uses uppercase values (PENDING, ACCEPTED, REJECTED,
 * REVIEWING), while the UI uses lowercase. This keeps both in sync.
 */
function normalizeApplicationStatus(status: string): string {
  return status.toUpperCase();
}

/** Updates an application status (recruiter action). */
export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.APPLICATION)
    .update({
      status: normalizeApplicationStatus(status),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id);
  throwIfError(error, "Failed to update application status");
}

/* ============================================================
 * Logbooks
 * ============================================================ */

export interface LogbookReport {
  id: string;
  internshipId: string;
  studentId: string;
  weekNumber?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  tasksPerformed?: string | null;
  skillsLearned?: string | null;
  challengesFaced?: string | null;
  hoursWorked?: number | null;
  attachmentUrls?: string | null;
  status?: string | null;
  recruiterComment?: string | null;
  shareToken?: string | null;
  createdAt?: string | null;
  internship?: { id?: string; title?: string | null } | null;
  student?: { id?: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null } | null;
}

/** Fetches logbook reports for the current user (student or recruiter). */
export async function fetchLogbookReports(): Promise<LogbookReport[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data: profile } = await supabase
    .from(TABLES.USER)
    .select("role")
    .eq("id", user.user.id)
    .single();

  let query = supabase
    .from(TABLES.LOGBOOK_REPORT)
    .select("*, internship:internshipId(id, title), student:studentId(id, name, email, university, major)")
    .order("createdAt", { ascending: false });

  if (profile?.role === "RECRUITER") {
    const { data: internships } = await supabase
      .from(TABLES.INTERNSHIP)
      .select("id")
      .eq("recruiterId", user.user.id);
    const ids = (internships || []).map((i) => i.id);
    if (ids.length === 0) return [];
    query = query.in("internshipId", ids);
  } else {
    query = query.eq("studentId", user.user.id);
  }

  const { data, error } = await query;
  throwIfError(error, "Failed to load logbook reports");
  return (data as LogbookReport[]) || [];
}

/** Creates a new logbook report. */
export async function createLogbookReport(payload: Record<string, unknown>): Promise<LogbookReport> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

const { data, error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .insert({ id: newId(), ...payload, studentId: user.user.id, status: payload.status || "DRAFT" })
    .select()
    .single();
  throwIfError(error, "Failed to save logbook report");
  return data as LogbookReport;
}

/** Adds recruiter comment / updates status on a report. */
export async function reviewLogbookReport(reportId: string, status: string, comment?: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .update({ status, recruiterComment: comment || null, updatedAt: new Date().toISOString() })
    .eq("id", reportId);
  throwIfError(error, "Failed to review report");
}

/** Generates a share token for an approved report. */
export async function generateShareToken(reportId: string): Promise<string> {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const { error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .update({ shareToken: token, updatedAt: new Date().toISOString() })
    .eq("id", reportId);
  throwIfError(error, "Failed to create share link");
  return token;
}

/** Fetches a shared report by share token. */
export async function fetchSharedReport(token: string): Promise<LogbookReport | null> {
  const { data, error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .select("*, internship:internshipId(id, title), student:studentId(id, name, email)")
    .eq("shareToken", token)
    .maybeSingle();
  throwIfError(error, "Failed to load shared report");
  return (data as LogbookReport) || null;
}

/* ============================================================
 * Admin
 * ============================================================ */

export async function fetchAdminStats() {
  const [students, recruiters, internships, applications] = await Promise.all([
    supabase.from(TABLES.USER).select("id", { count: "exact" }).eq("role", "STUDENT"),
    supabase.from(TABLES.USER).select("id", { count: "exact" }).eq("role", "RECRUITER"),
    supabase.from(TABLES.INTERNSHIP).select("id", { count: "exact" }).eq("status", "ACTIVE"),
    supabase.from(TABLES.APPLICATION).select("id", { count: "exact" }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: appsToday, error: appsTodayError } = await supabase
    .from(TABLES.APPLICATION)
    .select("id")
    .gte("createdAt", today.toISOString());

  return {
    totalStudents: students.count ?? 0,
    totalRecruiters: recruiters.count ?? 0,
    activeInternships: internships.count ?? 0,
    applicationsToday: appsToday?.length ?? 0,
  };
}

export async function fetchRecentActivity(count = 10) {
  const { data, error } = await supabase
    .from(TABLES.APPLICATION)
    .select("id, createdAt, status, internship:internshipId(title), student:studentId(name, email)")
    .order("createdAt", { ascending: false })
    .limit(count);
  throwIfError(error, "Failed to load recent activity");
  return (data || []).map((app: Record<string, unknown>) => ({
    type: "application",
    message: `${(app.student as { name?: string } | null)?.name || "A student"} applied to "${(app.internship as { title?: string } | null)?.title || "a role"}"`,
    timestamp: (app.createdAt as string) || new Date().toISOString(),
  }));
}

/* ============================================================
 * Users (admin)
 * ============================================================ */

export async function fetchUsers(role?: string) {
  let query = supabase.from(TABLES.USER).select("*").order("createdAt", { ascending: false });
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  throwIfError(error, "Failed to load users");
  return data || [];
}

export async function updateUser(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(TABLES.USER).update(payload).eq("id", id);
  throwIfError(error, "Failed to update user");
}

/* ============================================================
 * Meetings
 * ============================================================ */

export interface Meeting {
  id: string;
  title: string;
  studentId?: string | null;
  recruiterId?: string | null;
  scheduledFor: string;
  type: string;
  status: string;
  createdAt?: string | null;
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from(TABLES.MEETING)
    .select("*")
    .or(`studentId.eq.${user.user.id},recruiterId.eq.${user.user.id}`)
    .order("scheduledFor", { ascending: true });
  throwIfError(error, "Failed to load meetings");
  return (data as Meeting[]) || [];
}

export async function createMeeting(payload: Omit<Meeting, "id" | "createdAt">): Promise<Meeting> {
  const { data, error } = await supabase
    .from(TABLES.MEETING)
    .insert({ id: newId(), ...payload })
    .select()
    .single();
  throwIfError(error, "Failed to schedule meeting");
  return data as Meeting;
}
