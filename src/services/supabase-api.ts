import { supabase } from "@/lib/supabaseClient";
import { TABLES, STORAGE } from "@/lib/supabaseTables";
import CryptoJS from "crypto-js";

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
  supervisorId?: string | null;
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

function normalizeOverviewStatus(status?: string | null): string {
  return (status || "").toUpperCase();
}

function formatOverviewDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function placementStatusFromApplication(status?: string | null): string {
  const normalized = normalizeOverviewStatus(status);

  if (normalized.includes("ACCEPTED") || normalized.includes("APPROVED")) return "On Track";
  if (normalized.includes("REVIEW") || normalized.includes("PENDING") || normalized.includes("INTERVIEW")) return "Needs Review";
  if (normalized.includes("REJECTED")) return "No Placement";
  return "Pending";
}

export interface DepartmentCoordinatorOverviewData {
  stats: Array<{ title: string; value: number; description: string }>;
  studentPlacements: Array<{
    student: string;
    company: string;
    supervisor: string;
    status: string;
    endDate: string;
  }>;
  pendingApprovals: Array<{
    title: string;
    company: string;
    submittedBy: string;
    status: string;
  }>;
  organisations: Array<{
    name: string;
    students: number;
    sectors: string;
  }>;
}

export async function fetchDepartmentCoordinatorOverviewData(): Promise<DepartmentCoordinatorOverviewData> {
  const [scopeFilters, affiliationsResult, usersResult, internshipsResult, applicationsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.USER)
      .select("id, name, role, major, university, company, isApproved")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, recruiterId, supervisorId, createdAt, location, type, recruiter:recruiterId(name, company), supervisor:supervisorId(name)")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.APPLICATION)
      .select(
        "id, studentId, internshipId, status, createdAt, student:studentId(id, name, email, major, university), internship:internshipId(id, title, location, type, recruiter:recruiterId(name, company), supervisor:supervisorId(name))"
      )
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for department overview");
  throwIfError(usersResult.error, "Failed to load users for department overview");
  throwIfError(internshipsResult.error, "Failed to load internships for department overview");
  throwIfError(applicationsResult.error, "Failed to load applications for department overview");

  const users = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];
  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedUsers = allowedStudentIds ? users.filter((user) => allowedStudentIds.has(String(user.id || ""))) : users;
  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;
  const allowedInternshipIds = new Set(
    scopedApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );
  const scopedInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const studentUsers = scopedUsers.filter((user) => normalizeOverviewStatus(String(user.role ?? "")).includes("STUDENT"));
  const placedStudentIds = new Set(
    scopedApplications
      .map((application) => application.studentId as string | undefined)
      .filter((value): value is string => Boolean(value))
  );

  const activeInternships = scopedInternships.filter((internship) => normalizeOverviewStatus(String(internship.status ?? "")).includes("ACTIVE"));
  const supervisors = new Set(
    scopedInternships
      .map((internship) => internship.supervisorId as string | undefined)
      .filter((value): value is string => Boolean(value))
  );
  const visibleRecruiterIds = new Set(
    scopedInternships
      .map((internship) => internship.recruiterId as string | undefined)
      .filter((value): value is string => Boolean(value))
  );

  const organisationCounts = new Map<string, number>();
  for (const internship of scopedInternships) {
    const company = String((internship.recruiter as { company?: string | null } | null)?.company || "").trim();
    if (company) {
      organisationCounts.set(company, (organisationCounts.get(company) || 0) + 1);
    }
  }

  const recentApplications = [...scopedApplications]
    .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())
    .slice(0, 4);

  const studentPlacements = recentApplications.map((application) => ({
    student: String((application.student as { name?: string | null } | null)?.name || "Student"),
    company: String((application.internship as { recruiter?: { company?: string | null } | null } | null)?.recruiter?.company || "Company"),
    supervisor: String((application.internship as { supervisor?: { name?: string | null } | null } | null)?.supervisor?.name || "—"),
    status: placementStatusFromApplication(String(application.status || "")),
    endDate: String((application.internship as { location?: string | null } | null)?.location || "—"),
  }));

  const pendingApprovals = [...scopedInternships]
    .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())
    .slice(0, 3)
    .map((internship) => ({
      title: String(internship.title || "Unnamed internship"),
      company: String((internship.recruiter as { company?: string | null } | null)?.company || "Company"),
      submittedBy: `Recruiter: ${String((internship.recruiter as { name?: string | null } | null)?.name || "Unknown")}`,
      status: normalizeOverviewStatus(String(internship.status || "")).includes("ACTIVE") ? "Pending" : "Needs review",
    }));

  const organisations = Array.from(organisationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, students]) => ({
      name,
      students,
      sectors: String(
        scopedInternships.find((internship) => String((internship.recruiter as { company?: string | null } | null)?.company || "") === name)?.type ||
          "Internship placement"
      ),
    }));

  return {
    stats: [
      {
        title: "Students in department",
        value: studentUsers.length,
        description: `${placedStudentIds.size} currently placed across internship records`,
      },
      {
        title: "Assigned supervisors",
        value: supervisors.size,
        description: `${activeInternships.length} active internship records`,
      },
      {
        title: "Organisations hosting",
        value: organisations.length,
        description: `${visibleRecruiterIds.size} recruiter profiles identified`,
      },
      {
        title: "Students without placements",
        value: Math.max(studentUsers.length - placedStudentIds.size, 0),
        description: "Requires follow-up action",
      },
    ],
    studentPlacements,
    pendingApprovals,
    organisations,
  };
}

export interface FacultyCoordinatorOverviewData {
  stats: Array<{ title: string; value: number; description: string }>;
  internshipStats: Array<{ label: string; value: string; change: string; tone: "success" | "warning" | "default" }>;
  departmentOverview: Array<{ name: string; students: number; placements: number; completion: number }>;
  pendingActions: Array<{ title: string; count: number; detail: string }>;
  internshipReports: Array<{ student: string; department: string; organisation: string; status: string; date: string }>;
  assignedStudents: Array<{ name: string; organisation: string; companySupervisor: string; status: string; lastReport: string }>;
  recentFeedback: Array<{ student: string; message: string; date: string }>;
}

interface CoordinatorScopeFilters {
  hasSpecificScope: boolean;
  institutionIds: Set<string>;
  facultyIds: Set<string>;
  departmentIds: Set<string>;
}

async function getFacultyCoordinatorScopeFilters(): Promise<CoordinatorScopeFilters> {
  const defaults: CoordinatorScopeFilters = {
    hasSpecificScope: false,
    institutionIds: new Set(),
    facultyIds: new Set(),
    departmentIds: new Set(),
  };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return defaults;

  const { data, error } = await supabase
    .from(TABLES.COORDINATOR_ASSIGNMENT)
    .select("id, status, institutionId, facultyId, departmentId")
    .eq("coordinatorId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Failed to load coordinator assignments for scope filtering:", error);
    return defaults;
  }

  const assignments = (data as Array<Record<string, unknown>> | null) || [];
  const activeAssignments = assignments.filter((assignment) => String(assignment.status || "").toUpperCase() === "ACTIVE");

  if (activeAssignments.length === 0) return defaults;

  const institutionIds = new Set(
    activeAssignments
      .map((assignment) => String(assignment.institutionId || "").trim())
      .filter(Boolean)
  );
  const facultyIds = new Set(
    activeAssignments
      .map((assignment) => String(assignment.facultyId || "").trim())
      .filter(Boolean)
  );
  const departmentIds = new Set(
    activeAssignments
      .map((assignment) => String(assignment.departmentId || "").trim())
      .filter(Boolean)
  );

  return {
    hasSpecificScope: institutionIds.size > 0 || facultyIds.size > 0 || departmentIds.size > 0,
    institutionIds,
    facultyIds,
    departmentIds,
  };
}

function assignmentMatchesCoordinatorScope(
  assignment: Record<string, unknown>,
  filters: CoordinatorScopeFilters
): boolean {
  if (!filters.hasSpecificScope) return true;

  const institutionId = String(assignment.institutionId || "").trim();
  const facultyId = String(assignment.facultyId || "").trim();
  const departmentId = String(assignment.departmentId || "").trim();

  if (filters.departmentIds.size > 0 && departmentId && filters.departmentIds.has(departmentId)) return true;
  if (filters.facultyIds.size > 0 && facultyId && filters.facultyIds.has(facultyId)) return true;
  if (filters.institutionIds.size > 0 && institutionId && filters.institutionIds.has(institutionId)) return true;

  return false;
}

function studentMatchesFacultyCoordinatorScope(
  affiliation: Record<string, unknown>,
  filters: CoordinatorScopeFilters
): boolean {
  return assignmentMatchesCoordinatorScope(affiliation, filters);
}

export async function fetchFacultyCoordinatorOverviewData(): Promise<FacultyCoordinatorOverviewData> {
  const [scopeFilters, affiliationsResult, usersResult, internshipsResult, applicationsResult, logbooksResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase
      .from(TABLES.STUDENT_INSTITUTION_AFFILIATION)
      .select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.USER)
      .select("id, name, role, major, university, company, isApproved")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, recruiterId, supervisorId, createdAt, location, type, recruiter:recruiterId(name, company), supervisor:supervisorId(name)")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.APPLICATION)
      .select(
        "id, studentId, internshipId, status, createdAt, student:studentId(id, name, email, major, university), internship:internshipId(id, title, location, type, recruiter:recruiterId(name, company), supervisor:supervisorId(name))"
      )
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.LOGBOOK_REPORT)
      .select("id, studentId, internshipId, weekNumber, status, createdAt, student:studentId(id, name, email, major, university)")
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for faculty overview");
  throwIfError(usersResult.error, "Failed to load users for faculty overview");
  throwIfError(internshipsResult.error, "Failed to load internships for faculty overview");
  throwIfError(applicationsResult.error, "Failed to load applications for faculty overview");
  throwIfError(logbooksResult.error, "Failed to load logbooks for faculty overview");

  const users = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];
  const logbooks = (logbooksResult.data as Array<Record<string, unknown>> | null) || [];
  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedUsers = allowedStudentIds ? users.filter((user) => allowedStudentIds.has(String(user.id || ""))) : users;
  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;
  const scopedLogbooks = allowedStudentIds
    ? logbooks.filter((logbook) => allowedStudentIds.has(String(logbook.studentId || "")))
    : logbooks;
  const allowedInternshipIds = new Set(
    scopedApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );
  const scopedInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const visibleSupervisorIds = new Set(
    scopedInternships
      .map((internship) => String(internship.supervisorId || ""))
      .filter(Boolean)
  );
  const visibleRecruiterIds = new Set(
    scopedInternships
      .map((internship) => String(internship.recruiterId || ""))
      .filter(Boolean)
  );

  const studentUsers = scopedUsers.filter((user) => normalizeOverviewStatus(String(user.role ?? "")).includes("STUDENT"));
  const supervisorUsers = users.filter(
    (user) => normalizeOverviewStatus(String(user.role ?? "")).includes("SUPERVISOR") && visibleSupervisorIds.has(String(user.id || ""))
  );
  const recruiterUsers = users.filter(
    (user) => normalizeOverviewStatus(String(user.role ?? "")).includes("RECRUITER") && visibleRecruiterIds.has(String(user.id || ""))
  );

  const activeInternships = scopedInternships.filter((internship) => normalizeOverviewStatus(String(internship.status || "")).includes("ACTIVE"));
  const placedStudentIds = new Set(scopedApplications.map((application) => String(application.studentId || "")).filter(Boolean));

  const uniqueDepartments = new Set(
    studentUsers
      .map((student) => String(student.major || "").trim())
      .filter(Boolean)
  );

  const uniqueOrganisations = new Set(
    scopedInternships
      .map((internship) => String((internship.recruiter as { company?: string | null } | null)?.company || "").trim())
      .filter(Boolean)
  );

  const pendingApplications = scopedApplications.filter((application) => {
    const normalized = normalizeOverviewStatus(String(application.status || ""));
    return normalized.includes("PENDING") || normalized.includes("REVIEW");
  });

  const dueReports = scopedLogbooks.filter((logbook) => {
    const normalized = normalizeOverviewStatus(String(logbook.status || ""));
    return normalized.includes("DRAFT") || normalized.includes("SUBMITTED") || normalized.includes("PENDING");
  });

  const departmentOverview = Array.from(uniqueDepartments).slice(0, 4).map((department) => {
    const departmentStudents = studentUsers.filter((student) => String(student.major || "").trim() === department);
    const departmentPlacements = scopedApplications.filter((application) => String((application.student as { major?: string | null } | null)?.major || "").trim() === department).length;
    const completion = departmentStudents.length > 0 ? Math.min(Math.round((departmentPlacements / departmentStudents.length) * 100), 100) : 0;

    return {
      name: department,
      students: departmentStudents.length,
      placements: departmentPlacements,
      completion,
    };
  });

  const internshipReports = [...scopedApplications]
    .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())
    .slice(0, 3)
    .map((application) => ({
      student: String((application.student as { name?: string | null } | null)?.name || "Student"),
      department: String((application.student as { major?: string | null } | null)?.major || "Unassigned"),
      organisation: String((application.internship as { recruiter?: { company?: string | null } | null } | null)?.recruiter?.company || "Unassigned"),
      status: placementStatusFromApplication(String(application.status || "")),
      date: formatOverviewDate(String(application.createdAt || "")),
    }));

  const assignedStudents = [...scopedApplications]
    .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())
    .slice(0, 4)
    .map((application) => {
      const report = [...scopedLogbooks]
        .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())[0];

      return {
        name: String((application.student as { name?: string | null } | null)?.name || "Student"),
        organisation: String((application.internship as { recruiter?: { company?: string | null } | null } | null)?.recruiter?.company || "Unassigned"),
        companySupervisor: String((application.internship as { supervisor?: { name?: string | null } | null } | null)?.supervisor?.name || "Unassigned"),
        status: placementStatusFromApplication(String(application.status || "")),
        lastReport: report ? `Week ${report.weekNumber ?? 1} ${normalizeOverviewStatus(String(report.status || "")).includes("APPROVED") ? "submitted" : "pending"}` : "No recent report",
      };
    });

  const recentFeedback = [...scopedLogbooks]
    .filter((logbook) => {
      const normalized = normalizeOverviewStatus(String(logbook.status || ""));
      return normalized.includes("CHANGES_REQUESTED") || normalized.includes("REQUESTED_CHANGES") || normalized.includes("PENDING");
    })
    .sort((a, b) => new Date(b.createdAt as string | undefined || 0).getTime() - new Date(a.createdAt as string | undefined || 0).getTime())
    .slice(0, 3)
    .map((logbook) => ({
      student: String((logbook.student as { name?: string | null } | null)?.name || "Student"),
      message:
        normalizeOverviewStatus(String(logbook.status || "")).includes("CHANGES_REQUESTED") || normalizeOverviewStatus(String(logbook.status || "")).includes("REQUESTED_CHANGES")
          ? `Supervisor requested changes to Week ${logbook.weekNumber ?? 1} logbook.`
          : `Weekly report is awaiting review for Week ${logbook.weekNumber ?? 1}.`,
      date: formatOverviewDate(String(logbook.createdAt || "")),
    }));

  return {
    stats: [
      {
        title: "Total students on internship",
        value: placedStudentIds.size,
        description: `${studentUsers.length} student profiles detected`,
      },
      {
        title: "Total departments",
        value: uniqueDepartments.size,
        description: `${departmentOverview.length} departments identified`,
      },
      {
        title: "Total organisations",
        value: uniqueOrganisations.size,
        description: `${recruiterUsers.length} recruiter profiles identified`,
      },
      {
        title: "Total supervisors",
        value: supervisorUsers.length,
        description: `${activeInternships.length} active internship slots`,
      },
    ],
    internshipStats: [
      {
        label: "Active internship placements",
        value: `${Math.min(Math.round((activeInternships.length / Math.max(studentUsers.length, 1)) * 100), 100)}%`,
        change: `${activeInternships.length} active records`,
        tone: "success",
      },
      {
        label: "Completed internships",
        value: String(scopedApplications.filter((application) => normalizeOverviewStatus(String(application.status || "")).includes("ACCEPTED") || normalizeOverviewStatus(String(application.status || "")).includes("APPROVED")).length),
        change: `${scopedApplications.length} total applications`,
        tone: "default",
      },
      {
        label: "Pending confirmations",
        value: String(pendingApplications.length),
        change: "Awaiting follow-up",
        tone: "warning",
      },
      {
        label: "Average placement satisfaction",
        value: `${Math.max(0, Math.min(5, Number(((scopedApplications.length ? (scopedApplications.filter((application) => normalizeOverviewStatus(String(application.status || "")).includes("ACCEPTED") || normalizeOverviewStatus(String(application.status || "")).includes("APPROVED")).length / scopedApplications.length) : 0) * 5).toFixed(1))))}/5`,
        change: "+0.2",
        tone: "success",
      },
    ],
    departmentOverview,
    pendingActions: [
      {
        title: "Supervisor onboarding approvals",
        count: Math.max(supervisorUsers.length - activeInternships.length, 0),
        detail: "Awaiting confirmation for new supervisors",
      },
      {
        title: "Organisation verification requests",
        count: Math.max(uniqueOrganisations.size - recruiterUsers.length, 0),
        detail: "Needs review before student placements",
      },
      {
        title: "Report submissions due",
        count: dueReports.length,
        detail: "Students yet to submit or complete weekly reports",
      },
      {
        title: "Placement agreement renewals",
        count: 0,
        detail: "No renewals detected from current records",
      },
    ],
    internshipReports,
    assignedStudents,
    recentFeedback,
  };
}

export interface DepartmentCoordinatorStudentRow {
  name: string;
  internship: string;
  status: string;
  placement: string;
}

export async function fetchDepartmentCoordinatorStudentsData(): Promise<DepartmentCoordinatorStudentRow[]> {
  const [scopeFilters, affiliationsResult, usersResult, applicationsResult, internshipsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase.from(TABLES.USER).select("id, name, role").order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.APPLICATION)
      .select(
        "id, studentId, internshipId, status, createdAt, student:studentId(id, name), internship:internshipId(id, title, recruiter:recruiterId(name, company))"
      )
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, recruiterId, recruiter:recruiterId(name, company)")
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for department students");
  throwIfError(usersResult.error, "Failed to load students for department coordinator");
  throwIfError(applicationsResult.error, "Failed to load applications for department coordinator");
  throwIfError(internshipsResult.error, "Failed to load internships for department coordinator");

  const users = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedUsers = allowedStudentIds ? users.filter((user) => allowedStudentIds.has(String(user.id || ""))) : users;
  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;

  const students = scopedUsers.filter((user) => normalizeOverviewStatus(String(user.role || "")).includes("STUDENT"));
  const studentsById = new Map(students.map((student) => [String(student.id || ""), student]));

  const rows = scopedApplications.map((application) => {
    const student = application.student as { name?: string | null } | null;
    const internship = application.internship as { title?: string | null; recruiter?: { company?: string | null } | null } | null;
    const placementStatus = placementStatusFromApplication(String(application.status || ""));

    return {
      name: student?.name || "Student",
      internship: internship?.title || internship?.recruiter?.company || "Unassigned",
      status: placementStatus,
      placement: internship ? "Confirmed" : "Pending",
    };
  });

  if (rows.length > 0) return rows.slice(0, 8);

  return students.slice(0, 8).map((student) => ({
    name: String(student.name || "Student"),
    internship: "Unassigned",
    status: "No Placement",
    placement: "Pending",
  }));
}

export interface DepartmentCoordinatorOrganisationRow {
  name: string;
  sector: string;
  students: number;
  contact: string;
  status: string;
}

export async function fetchDepartmentCoordinatorOrganisationsData(): Promise<DepartmentCoordinatorOrganisationRow[]> {
  const [scopeFilters, affiliationsResult, internshipsResult, usersResult, applicationsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, type, location, recruiterId, recruiter:recruiterId(name, company)")
      .order("createdAt", { ascending: false }),
    supabase.from(TABLES.USER).select("id, name, role, company").order("createdAt", { ascending: false }),
    supabase.from(TABLES.APPLICATION).select("id, studentId, internshipId").order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for department organisations");
  throwIfError(internshipsResult.error, "Failed to load internships for department organisations");
  throwIfError(usersResult.error, "Failed to load users for department organisations");
  throwIfError(applicationsResult.error, "Failed to load applications for department organisations");

  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const users = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;
  const allowedInternshipIds = new Set(
    scopedApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );
  const scopedInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const companyMap = new Map<string, DepartmentCoordinatorOrganisationRow>();

  for (const internship of scopedInternships) {
    const company = String((internship.recruiter as { company?: string | null } | null)?.company || "").trim();
    const recruiterName = String((internship.recruiter as { name?: string | null } | null)?.name || "Recruiter").trim();
    if (!company) continue;

    const existing = companyMap.get(company) || {
      name: company,
      sector: String(internship.type || internship.location || "Internship placement"),
      students: 0,
      contact: recruiterName,
      status: "Verified",
    };

    existing.students += 1;
    existing.contact = recruiterName || existing.contact;
    companyMap.set(company, existing);
  }

  if (companyMap.size === 0) {
    return users
      .filter((user) => normalizeOverviewStatus(String(user.role || "")).includes("RECRUITER"))
      .slice(0, 4)
      .map((user) => ({
        name: String(user.company || "Company"),
        sector: String(user.company || "Internship placement"),
        students: 0,
        contact: String(user.name || "Recruiter"),
        status: "Pending",
      }));
  }

  return Array.from(companyMap.values())
    .sort((a, b) => b.students - a.students)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      status: item.students > 0 ? "Verified" : "Pending",
    }));
}

export interface DepartmentCoordinatorPlacementRow {
  student: string;
  company: string;
  supervisor: string;
  progress: number;
  status: string;
}

export async function fetchDepartmentCoordinatorPlacementsData(): Promise<DepartmentCoordinatorPlacementRow[]> {
  const [scopeFilters, affiliationsResult, usersResult, applicationsResult, internshipsResult, logbooksResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase.from(TABLES.USER).select("id, name, role").order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.APPLICATION)
      .select(
        "id, studentId, internshipId, status, createdAt, student:studentId(id, name), internship:internshipId(id, title, supervisorId, recruiter:recruiterId(name, company), supervisor:supervisorId(name))"
      )
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, supervisorId, recruiterId, recruiter:recruiterId(name, company), supervisor:supervisorId(name)")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.LOGBOOK_REPORT)
      .select("id, studentId, internshipId, weekNumber, status, createdAt")
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for department placements");
  throwIfError(usersResult.error, "Failed to load users for department placements");
  throwIfError(applicationsResult.error, "Failed to load applications for department placements");
  throwIfError(internshipsResult.error, "Failed to load internships for department placements");
  throwIfError(logbooksResult.error, "Failed to load logbooks for department placements");

  const students = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const logbooks = (logbooksResult.data as Array<Record<string, unknown>> | null) || [];
  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedStudents = allowedStudentIds ? students.filter((user) => allowedStudentIds.has(String(user.id || ""))) : students;
  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;
  const allowedInternshipIds = new Set(
    scopedApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );
  const scopedInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const studentUsers = scopedStudents.filter((user) => normalizeOverviewStatus(String(user.role || "")).includes("STUDENT"));
  const internshipsById = new Map(scopedInternships.map((internship) => [String(internship.id || ""), internship]));

  const latestLogbookByStudent = new Map<string, Record<string, unknown>>();
  for (const logbook of logbooks) {
    const studentId = String(logbook.studentId || "");
    if (!latestLogbookByStudent.has(studentId)) {
      latestLogbookByStudent.set(studentId, logbook);
    }
  }

  const studentRows: DepartmentCoordinatorPlacementRow[] = studentUsers.map((student) => {
    const appsForStudent = scopedApplications.filter((application) => String(application.studentId || "") === String(student.id || ""));
    const latestApp = appsForStudent[0] || null;
    const internship = latestApp ? internshipsById.get(String((latestApp as Record<string, unknown>).internshipId || "")) : null;
    const latestLogbook = latestLogbookByStudent.get(String(student.id || ""));
    const statusSource = latestLogbook?.status || latestApp?.status || "PENDING";
    const progress = getProgressFromStatus(String(statusSource));

    return {
      student: String(student.name || "Student"),
      company: String((internship?.recruiter as { company?: string | null } | null)?.company || "Unassigned"),
      supervisor: String((internship?.supervisor as { name?: string | null } | null)?.name || "—"),
      progress,
      status: getStatusLabel(progress),
    };
  });

  return studentRows.slice(0, 8);
}

export interface DepartmentCoordinatorReportRow {
  title: string;
  sender: string;
  date: string;
  status: string;
}

export async function fetchDepartmentCoordinatorReportsData(): Promise<DepartmentCoordinatorReportRow[]> {
  const [scopeFilters, affiliationsResult, reportsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.LOGBOOK_REPORT)
      .select(
        "id, studentId, internshipId, weekNumber, status, createdAt, student:studentId(id, name), internship:internshipId(id, title, recruiter:recruiterId(name, company))"
      )
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for department reports");
  throwIfError(reportsResult.error, "Failed to load department reports");

  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];
  const reports = (reportsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const filteredReports = allowedStudentIds
    ? reports.filter((report) => allowedStudentIds.has(String(report.studentId || "")))
    : reports;

  return filteredReports.slice(0, 6).map((report) => ({
    title: `Week ${report.weekNumber ?? 1} report`,
    sender: String((report.student as { name?: string | null } | null)?.name || "Student"),
    date: formatOverviewDate(String(report.createdAt || "")),
    status: report.status ? mapReportStatus(String(report.status)) : "Pending",
  }));
}

export interface FacultyCoordinatorDepartmentRow {
  name: string;
  students: number;
  supervisors: number;
  activePlacements: number;
  health: string;
}

export async function fetchFacultyCoordinatorDepartmentsData(): Promise<FacultyCoordinatorDepartmentRow[]> {
  const [scopeFilters, affiliationsResult, usersResult, applicationsResult, internshipsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase.from(TABLES.USER).select("id, name, role, major").order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.APPLICATION)
      .select("id, studentId, internshipId, student:studentId(id, major, name)")
      .order("createdAt", { ascending: false }),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, supervisorId")
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for faculty departments");
  throwIfError(usersResult.error, "Failed to load users for faculty departments");
  throwIfError(applicationsResult.error, "Failed to load applications for faculty departments");
  throwIfError(internshipsResult.error, "Failed to load internships for faculty departments");

  const users = (usersResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const scopedStudents = allowedStudentIds
    ? users.filter((user) => allowedStudentIds.has(String(user.id || "")))
    : users;
  const scopedApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;
  const allowedInternshipIds = new Set(
    scopedApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );
  const scopedInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const students = scopedStudents.filter((user) => normalizeOverviewStatus(String(user.role || "")).includes("STUDENT"));
  const departments = new Map<string, FacultyCoordinatorDepartmentRow>();

  for (const student of students) {
    const dept = String(student.major || "Unassigned").trim();
    const existing = departments.get(dept) || {
      name: dept,
      students: 0,
      supervisors: 0,
      activePlacements: 0,
      health: "Stable",
    };
    existing.students += 1;
    departments.set(dept, existing);
  }

  for (const internship of scopedInternships) {
    if (normalizeOverviewStatus(String(internship.status || "")).includes("ACTIVE")) {
      const dept = "Active placements";
      const existing = departments.get(dept) || {
        name: dept,
        students: 0,
        supervisors: 0,
        activePlacements: 0,
        health: "Stable",
      };
      existing.activePlacements += 1;
      departments.set(dept, existing);
    }
  }

  const mapped = Array.from(departments.values())
    .filter((item) => item.name !== "Active placements")
    .map((item) => {
      const placements = scopedApplications.filter(
        (application) => String((application.student as { major?: string | null } | null)?.major || "") === item.name
      ).length;
      const completion = item.students > 0 ? Math.min(Math.round((placements / item.students) * 100), 100) : 0;
      return {
        ...item,
        activePlacements: placements,
        supervisors: Math.max(1, Math.min(9, Math.round(placements / 2))),
        health: completion >= 75 ? "Strong" : completion >= 55 ? "Stable" : "Needs attention",
      };
    });

  return mapped.slice(0, 4);
}

export interface FacultyCoordinatorReportRow {
  title: string;
  type: string;
  date: string;
  status: string;
}

export async function fetchFacultyCoordinatorReportsData(): Promise<FacultyCoordinatorReportRow[]> {
  const [scopeFilters, affiliationsResult, reportsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.LOGBOOK_REPORT)
      .select("id, studentId, weekNumber, status, createdAt, student:studentId(name)")
      .order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for faculty reports");
  throwIfError(reportsResult.error, "Failed to load faculty reports");

  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];
  const reports = (reportsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const filteredReports = allowedStudentIds
    ? reports.filter((report) => allowedStudentIds.has(String(report.studentId || "")))
    : reports;

  return filteredReports.slice(0, 4).map((report, index) => ({
    title: `Week ${report.weekNumber ?? index + 1} internship progress report`,
    type: "Faculty report",
    date: formatOverviewDate(String(report.createdAt || "")),
    status: report.status ? mapReportStatus(String(report.status)) : "Ready",
  }));
}

export interface FacultyCoordinatorPlacementRow {
  organisation: string;
  domain: string;
  students: number;
  status: string;
}

export async function fetchFacultyCoordinatorPlacementsData(): Promise<FacultyCoordinatorPlacementRow[]> {
  const [scopeFilters, affiliationsResult, internshipsResult, applicationsResult] = await Promise.all([
    getFacultyCoordinatorScopeFilters(),
    supabase.from(TABLES.STUDENT_INSTITUTION_AFFILIATION).select("studentId, institutionId, facultyId, departmentId"),
    supabase
      .from(TABLES.INTERNSHIP)
      .select("id, title, status, type, location, recruiterId, recruiter:recruiterId(name, company)")
      .order("createdAt", { ascending: false }),
    supabase.from(TABLES.APPLICATION).select("id, internshipId, studentId").order("createdAt", { ascending: false }),
  ]);

  throwIfError(affiliationsResult.error, "Failed to load affiliations for faculty placements");
  throwIfError(internshipsResult.error, "Failed to load internships for faculty placements");
  throwIfError(applicationsResult.error, "Failed to load applications for faculty placements");

  const affiliations = (affiliationsResult.data as Array<Record<string, unknown>> | null) || [];
  const internships = (internshipsResult.data as Array<Record<string, unknown>> | null) || [];
  const applications = (applicationsResult.data as Array<Record<string, unknown>> | null) || [];

  const allowedStudentIds = scopeFilters.hasSpecificScope
    ? new Set(
        affiliations
          .filter((affiliation) => studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters))
          .map((affiliation) => String(affiliation.studentId || ""))
          .filter(Boolean)
      )
    : null;

  const filteredApplications = allowedStudentIds
    ? applications.filter((application) => allowedStudentIds.has(String(application.studentId || "")))
    : applications;

  const allowedInternshipIds = new Set(
    filteredApplications.map((application) => String(application.internshipId || "")).filter(Boolean)
  );

  const filteredInternships = allowedStudentIds
    ? internships.filter((internship) => allowedInternshipIds.has(String(internship.id || "")))
    : internships;

  const counts = new Map<string, number>();

  for (const application of filteredApplications) {
    const internshipId = String(application.internshipId || "");
    counts.set(internshipId, (counts.get(internshipId) || 0) + 1);
  }

  return filteredInternships.slice(0, 4).map((internship) => ({
    organisation: String((internship.recruiter as { company?: string | null } | null)?.company || "Company"),
    domain: String(internship.type || internship.location || "Internship placement"),
    students: counts.get(String(internship.id || "")) || 0,
    status: normalizeOverviewStatus(String(internship.status || "")).includes("ACTIVE") ? "Active" : "Pending",
  }));
}

export interface FacultyCoordinatorManagementRow {
  name: string;
  department: string;
  role: string;
  status: string;
  coordinatorId?: string;
  assignmentId?: string;
  institution?: string;
  faculty?: string;
  institutionId?: string;
  facultyId?: string;
  departmentId?: string;
}

function formatCoordinatorRole(role: string | null | undefined): string {
  const normalized = String(role || "").trim();

  if (!normalized) return "Student";

  const lower = normalized.toLowerCase();
  if (lower.includes("faculty")) return "Faculty Coordinator";
  if (lower.includes("department")) return "Department Coordinator";
  if (lower.includes("supervisor")) return "Supervisor";
  if (lower.includes("admin")) return "Admin";
  if (lower.includes("recruiter")) return "Recruiter";

  return normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function fetchFacultyCoordinatorManagementData(): Promise<FacultyCoordinatorManagementRow[]> {
  const scopeFilters = await getFacultyCoordinatorScopeFilters();

  let users: Array<Record<string, unknown>> = [];
  let affiliations: Array<Record<string, unknown>> = [];
  let faculties: Array<Record<string, unknown>> = [];
  let departments: Array<Record<string, unknown>> = [];
  let institutions: Array<Record<string, unknown>> = [];
  let assignments: Array<Record<string, unknown>> = [];

  try {
    const { data, error } = await supabase
      .from(TABLES.USER)
      .select("id, name, role, major, company, isApproved")
      .order("createdAt", { ascending: false });

    throwIfError(error, "Failed to load users for faculty management");
    users = (data as Array<Record<string, unknown>> | null) || [];
  } catch (error) {
    console.error("Failed to load faculty management users:", error);
    return [];
  }

  const safeFetch = async (table: string, select: string): Promise<Array<Record<string, unknown>>> => {
    try {
      const { data, error } = await supabase.from(table).select(select);
      if (error) {
        return [];
      }
      return (data as Array<Record<string, unknown>> | null) || [];
    } catch (error) {
      console.error(`Failed to load ${table}:`, error);
      return [];
    }
  };

  affiliations = await safeFetch(TABLES.STUDENT_INSTITUTION_AFFILIATION, "id, studentId, institutionId, facultyId, departmentId, studentNumber");
  faculties = await safeFetch(TABLES.FACULTY_SCHOOL, "id, name, institutionId");
  departments = await safeFetch(TABLES.DEPARTMENT, "id, name, institutionId, facultyId");
  institutions = await safeFetch(TABLES.INSTITUTION, "id, name");
  assignments = await safeFetch(TABLES.COORDINATOR_ASSIGNMENT, "id, coordinatorId, role, status, institutionId, facultyId, departmentId");

  const institutionById = new Map<string, string>(
    institutions.map((item) => [String(item.id || ""), String(item.name || "")]).filter(([id]) => Boolean(id))
  );

  const facultyById = new Map<string, string>(
    faculties.map((item) => [String(item.id || ""), String(item.name || "")]).filter(([id]) => Boolean(id))
  );

  const departmentById = new Map<string, string>(
    departments.map((item) => [String(item.id || ""), String(item.name || "")]).filter(([id]) => Boolean(id))
  );

  const affiliationByStudentId = new Map<string, Record<string, unknown>>();
  for (const affiliation of affiliations) {
    const studentId = String(affiliation.studentId || "");
    if (studentId) {
      affiliationByStudentId.set(studentId, affiliation);
    }
  }

  const assignmentByCoordinatorId = new Map<string, Array<Record<string, unknown>>>();
  for (const assignment of assignments) {
    const coordinatorId = String(assignment.coordinatorId || "");
    if (!coordinatorId) continue;

    const existing = assignmentByCoordinatorId.get(coordinatorId) || [];
    existing.push(assignment);
    assignmentByCoordinatorId.set(coordinatorId, existing);
  }

  const filteredUsers = users.filter((user) => {
    const role = String(user.role || "");
    const isCoordinatorLike = role.toLowerCase().includes("coordinator") || role.toLowerCase().includes("admin") || role.toLowerCase().includes("supervisor");

    if (!isCoordinatorLike) {
      return false;
    }

    const coordinatorAssignments = assignmentByCoordinatorId.get(String(user.id || "")) || [];

    if (!scopeFilters.hasSpecificScope) {
      return true;
    }

    if (coordinatorAssignments.some((assignment) => assignmentMatchesCoordinatorScope(assignment, scopeFilters))) {
      return true;
    }

    const affiliation = affiliationByStudentId.get(String(user.id || ""));
    return affiliation ? studentMatchesFacultyCoordinatorScope(affiliation, scopeFilters) : false;
  });

  return filteredUsers
    .slice(0, 8)
    .map((user) => {
      const rawRole = String(user.role || "") || "STUDENT";
      const affiliation = affiliationByStudentId.get(String(user.id || ""));
      const institutionName = institutionById.get(String(affiliation?.institutionId || "")) || "Unassigned";
      const facultyName = facultyById.get(String(affiliation?.facultyId || "")) || "Unassigned";
      const departmentName =
        departmentById.get(String(affiliation?.departmentId || "")) ||
        facultyById.get(String(affiliation?.facultyId || "")) ||
        institutionById.get(String(affiliation?.institutionId || "")) ||
        String(user.major || user.company || "Unassigned");

      const assignmentNotes = assignmentByCoordinatorId.get(String(user.id || "")) || [];
      const primaryAssignment = assignmentNotes[0] as Record<string, unknown> | undefined;
      const status = primaryAssignment?.status
        ? String(primaryAssignment.status)
        : user.isApproved
          ? "Active"
          : "Pending";

      return {
        name: String(user.name || "User"),
        department: departmentName,
        role: formatCoordinatorRole(String(primaryAssignment?.role || rawRole)),
        status: status === "ACTIVE" ? "Active" : status === "PENDING" ? "Pending" : status,
        coordinatorId: String(user.id || ""),
        assignmentId: primaryAssignment?.id ? String(primaryAssignment.id) : undefined,
        institution: institutionName,
        faculty: facultyName,
        institutionId: primaryAssignment?.institutionId ? String(primaryAssignment.institutionId) : affiliation?.institutionId ? String(affiliation.institutionId) : undefined,
        facultyId: primaryAssignment?.facultyId ? String(primaryAssignment.facultyId) : affiliation?.facultyId ? String(affiliation.facultyId) : undefined,
        departmentId: primaryAssignment?.departmentId ? String(primaryAssignment.departmentId) : affiliation?.departmentId ? String(affiliation.departmentId) : undefined,
      };
    });
}

function mapReportStatus(status: string): string {
  const normalized = normalizeOverviewStatus(status);

  if (normalized.includes("APPROVED") || normalized.includes("COMPLETED")) return "Reviewed";
  if (normalized.includes("REQUESTED_CHANGES") || normalized.includes("CHANGES_REQUESTED")) return "Needs review";
  if (normalized.includes("PENDING") || normalized.includes("SUBMITTED")) return "Pending";
  if (normalized.includes("DRAFT")) return "Draft";
  return "Review";
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
  const { data: user } = await supabase.auth.getUser();
  const reviewedById = user?.user?.id ?? null;

  // Map recruiter actions onto the multi-stage workflow:
  //  - recruiter "APPROVED" forwards the report to the supervisor.
  //  - recruiter "NEEDS_REVISION" / "REQUESTED_CHANGES" sends it back to the
  //    student with a "RECRUITER_CHANGES_REQUESTED" status.
  let nextStatus = status;
  if (status === "APPROVED") nextStatus = "PENDING_SUPERVISOR_REVIEW";
  if (status === "NEEDS_REVISION" || status === "REQUESTED_CHANGES") nextStatus = "RECRUITER_CHANGES_REQUESTED";

  const { error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .update({
      status: nextStatus,
      recruiterComment: comment || null,
      reviewedById,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", reportId);
  throwIfError(error, "Failed to review report");
}

/** Adds supervisor comment / updates status on a report. */
export async function reviewLogbookAsSupervisor(
  reportId: string,
  status: string,
  comment?: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const reviewedById = user?.user?.id ?? null;

  // Supervisor approvals move to SUPERVISOR_APPROVED; requesting changes sends
  // the report back to the recruiter queue (never bypasses the recruiter).
  const nextStatus =
    status === "APPROVED"
      ? "SUPERVISOR_APPROVED"
      : status === "NEEDS_REVISION" || status === "REQUESTED_CHANGES"
      ? "SUPERVISOR_CHANGES_REQUESTED"
      : status;

  const { error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .update({
      status: nextStatus,
      supervisorComment: comment || null,
      reviewedById,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
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

export interface DepartmentCoordinatorRequest {
  id: string;
  userId: string | null;
  fullName: string;
  officialEmail: string;
  phoneNumber: string;
  staffId: string;
  institutionId: string;
  facultyId: string;
  departmentId: string;
  institutionName?: string | null;
  facultyName?: string | null;
  departmentName?: string | null;
  positionTitle: string;
  coordinatorResponsibility: string;
  status: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  institution?: { name?: string | null } | null;
  faculty?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
}

export async function submitDepartmentCoordinatorRequest(payload: {
  userId: string;
  fullName: string;
  officialEmail: string;
  phoneNumber: string;
  staffId: string;
  institutionId: string;
  facultyId: string;
  departmentId: string;
  positionTitle: string;
  coordinatorResponsibility: string;
}): Promise<void> {
  const { error } = await supabase.from(TABLES.DEPARTMENT_COORDINATOR_REQUEST).insert({
    id: newId(),
    userId: payload.userId,
    fullName: payload.fullName.trim(),
    officialEmail: payload.officialEmail.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    staffId: payload.staffId.trim(),
    institutionId: payload.institutionId,
    facultyId: payload.facultyId,
    departmentId: payload.departmentId,
    positionTitle: payload.positionTitle.trim(),
    coordinatorResponsibility: payload.coordinatorResponsibility.trim(),
    status: "PENDING",
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  throwIfError(error, "Failed to submit Department Coordinator request");
}

export async function fetchDepartmentCoordinatorRequests(): Promise<DepartmentCoordinatorRequest[]> {
  const { data, error } = await supabase
    .from(TABLES.DEPARTMENT_COORDINATOR_REQUEST)
    .select("*, institution:institutionId(name), faculty:facultyId(name), department:departmentId(name)")
    .order("submittedAt", { ascending: false });
  throwIfError(error, "Failed to load Department Coordinator requests");
  return (data as DepartmentCoordinatorRequest[]) || [];
}

export async function reviewDepartmentCoordinatorRequest(
  request: DepartmentCoordinatorRequest,
  decision: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const reviewerId = authData.user?.id;
  if (!reviewerId) throw new Error("You must be signed in as an administrator.");

  const now = new Date().toISOString();
  const { error: requestError } = await supabase
    .from(TABLES.DEPARTMENT_COORDINATOR_REQUEST)
    .update({
      status: decision,
      reviewedById: reviewerId,
      reviewedAt: now,
      rejectionReason: decision === "REJECTED" ? rejectionReason?.trim() || null : null,
      updatedAt: now,
    })
    .eq("id", request.id);
  throwIfError(requestError, "Failed to update coordinator request");

  if (request.userId) {
    const { error: userError } = await supabase
      .from(TABLES.USER)
      .update({
        coordinatorStatus: decision,
        isApproved: decision === "APPROVED",
        approvedAt: decision === "APPROVED" ? now : null,
        rejectedAt: decision === "REJECTED" ? now : null,
        approvalReviewedById: reviewerId,
        updatedAt: now,
      })
      .eq("id", request.userId);
    throwIfError(userError, "Failed to update coordinator account status");
  }
}

export async function activateDepartmentCoordinator(positionTitle: string, coordinatorResponsibility: string): Promise<void> {
  const { data, error } = await supabase.rpc("activate_department_coordinator", {
    p_position_title: positionTitle,
    p_coordinator_responsibility: coordinatorResponsibility,
  });
  throwIfError(error, "Failed to activate Department Coordinator account");
  if (!(data as { success?: boolean } | null)?.success) {
    throw new Error((data as { message?: string } | null)?.message || "Coordinator activation was not completed.");
  }
}

export async function createCoordinatorAssignment(payload: {
  coordinatorId: string;
  role?: string | null;
  status?: string | null;
  institutionId?: string | null;
  facultyId?: string | null;
  departmentId?: string | null;
}): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const now = new Date().toISOString();

  const { error } = await supabase.from(TABLES.COORDINATOR_ASSIGNMENT).insert({
    id: newId(),
    coordinatorId: payload.coordinatorId,
    role: payload.role || "Faculty Coordinator",
    status: payload.status || "PENDING",
    institutionId: payload.institutionId || null,
    facultyId: payload.facultyId || null,
    departmentId: payload.departmentId || null,
    assignedById: user.user.id,
    createdAt: now,
    updatedAt: now,
  });

  throwIfError(error, "Failed to create coordinator assignment");
}

export async function updateCoordinatorAssignment(
  id: string,
  payload: {
    role?: string | null;
    status?: string | null;
    institutionId?: string | null;
    facultyId?: string | null;
    departmentId?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.COORDINATOR_ASSIGNMENT)
    .update({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id);

  throwIfError(error, "Failed to update coordinator assignment");
}

export async function deleteCoordinatorAssignment(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.COORDINATOR_ASSIGNMENT).delete().eq("id", id);
  throwIfError(error, "Failed to delete coordinator assignment");
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
  participantname: string;
  participantemail?: string | null;
  createdbyemail?: string | null;
  scheduledfor: string;
  type: string;
  status: string;
  createdat?: string | null;
  updatedat?: string | null;
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from(TABLES.MEETING)
    .select("*")
    .order("scheduledfor", { ascending: true });
  throwIfError(error, "Failed to load meetings");
  return (data as Meeting[]) || [];
}

export async function createMeeting(payload: Omit<Meeting, "id" | "createdat">): Promise<Meeting> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in to schedule a meeting.");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLES.MEETING)
    .insert({
      id: newId(),
      ...payload,
      status: payload.status || "upcoming",
      createdat: now,
      updatedat: now,
    })
    .select()
    .single();
  throwIfError(error, "Failed to schedule meeting");
  return data as Meeting;
}

/* ============================================================
 * University Supervisor
 * ============================================================ */

export interface SupervisorInvitation {
  id: string;
  studentId: string;
  internshipId?: string | null;
  name: string;
  email: string;
  department?: string | null;
  university?: string | null;
  phone?: string | null;
  tokenHash?: string | null;
  tokenExpiresAt?: string | null;
  activatedAt?: string | null;
  activatedById?: string | null;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CoordinatorInvitation {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  tokenHash?: string | null;
  tokenExpiresAt?: string | null;
  activatedAt?: string | null;
  activatedById?: string | null;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdById?: string | null;
}

function sha256Hex(text: string): string {
  // crypto-js is a project dependency and works in the browser.
  return CryptoJS.SHA256(text).toString();
}

/** Generates a cryptographically random, URL-safe raw token (never stored). */
function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("");
}

/**
 * Student creates an invitation for their university supervisor. The raw
 * activation token is returned (to surface in the UI / hand to email later);
 * only its SHA-256 hash is persisted. Expires after 48h.
 */
export async function createSupervisorInvitation(payload: {
  name: string;
  email: string;
  department?: string;
  university?: string;
  phone?: string;
  internshipId?: string;
}): Promise<{ invitation: SupervisorInvitation; activationToken: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const rawToken = generateInvitationToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLES.SUPERVISOR_INVITATION)
    .insert({
      id: newId(),
      studentId: user.user.id,
      name: payload.name,
      email: payload.email,
      department: payload.department || null,
      university: payload.university || null,
      phone: payload.phone || null,
      internshipId: payload.internshipId || null,
      tokenHash: sha256Hex(rawToken),
      tokenExpiresAt: expiresAt,
      status: "SENT",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    .select()
    .single();
  throwIfError(error, "Failed to create supervisor invitation");
  return { invitation: data as SupervisorInvitation, activationToken: rawToken };
}

/** Fetches the current student's supervisor invitations. */
export async function fetchMySupervisorInvitations(): Promise<SupervisorInvitation[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from(TABLES.SUPERVISOR_INVITATION)
    .select("*, internship:internshipId(id, title)")
    .eq("studentId", user.user.id)
    .order("createdAt", { ascending: false });
  throwIfError(error, "Failed to load supervisor invitations");
  return (data as SupervisorInvitation[]) || [];
}

/** Creates a department coordinator invitation and returns the activation link. */
export async function createCoordinatorInvitation(payload: {
  name?: string;
  email: string;
  role?: string;
}): Promise<{ invitation: CoordinatorInvitation; activationToken: string; activationLink: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const rawToken = generateInvitationToken();
  const role = (payload.role || "Department Coordinator").trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLES.COORDINATOR_INVITATION)
    .insert({
      id: newId(),
      email: payload.email.trim(),
      name: payload.name?.trim() || null,
      role,
      tokenHash: sha256Hex(rawToken),
      tokenExpiresAt: expiresAt,
      status: "SENT",
      createdById: user.user.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    .select()
    .single();
  throwIfError(error, "Failed to create coordinator invitation");

  const activationLink = `${window.location.origin}/coordinator/activate/${rawToken}`;

  try {
    await supabase.functions.invoke("send-email", {
      body: {
        to: payload.email.trim(),
        subject: "InternConnect coordinator activation",
        text: `Use this link to activate your InternConnect coordinator account:\n${activationLink}`,
        html: `<p>Use this link to activate your InternConnect coordinator account:</p><p><a href="${activationLink}">${activationLink}</a></p>`,
      },
    });
  } catch (invokeError) {
    console.info("Coordinator email delivery was not configured or could not be sent:", invokeError);
  }

  return {
    invitation: data as CoordinatorInvitation,
    activationToken: rawToken,
    activationLink,
  };
}

/** Fetches all coordinator invitations for the admin. */
export async function fetchCoordinatorInvitations(): Promise<CoordinatorInvitation[]> {
  const { data, error } = await supabase
    .from(TABLES.COORDINATOR_INVITATION)
    .select("*")
    .order("createdAt", { ascending: false });
  throwIfError(error, "Failed to load coordinator invitations");
  return (data as CoordinatorInvitation[]) || [];
}

/** Resolves a coordinator invitation by raw token (public page, before activation). */
export async function getCoordinatorInvitation(
  token: string
): Promise<{ valid: boolean; reason?: string; email?: string; name?: string }> {
  const { data, error } = await supabase.rpc("get_coordinator_invitation", {
    p_raw_token: (token || "").trim(),
  });
  if (error) throw error;
  return (data || { valid: false, reason: "invalid" }) as {
    valid: boolean;
    reason?: string;
    email?: string;
    name?: string;
  };
}

/** Activates a coordinator invitation token. */
export async function activateCoordinatorInvitation(
  token: string,
  name: string,
  password: string
): Promise<{ email: string; userId: string; invitationId: string }> {
  const tokenTrim = (token || "").trim();
  if (!tokenTrim) throw new Error("Missing invitation token.");

  const invite = await getCoordinatorInvitation(tokenTrim);
  if (!invite.valid || !invite.email) {
    throw new Error("This invitation link is invalid, expired, or already used.");
  }

  const signUp = await supabase.auth.signUp({
    email: invite.email.trim(),
    password,
    options: { data: { name, role: "DEPARTMENT_COORDINATOR" } },
  });
  if (signUp.error) throw signUp.error;
  const userId = signUp.data.user?.id;
  if (!userId) throw new Error("Could not create the coordinator account.");

  const { data, error } = await supabase.rpc("activate_coordinator_invitation", {
    p_raw_token: tokenTrim,
    p_user_id: userId,
    p_user_email: invite.email.trim(),
    p_user_name: name,
  });
  if (error) throw error;

  const result = data as { success?: boolean; message?: string; userId?: string; email?: string };
  if (!result?.success) {
    throw new Error(result?.message || "Could not activate the coordinator invitation.");
  }

  return {
    email: result.email || invite.email,
    userId: result.userId || userId,
    invitationId: tokenTrim,
  };
}

/**
 * Resolves an invitation by raw token (public page, before the supervisor has
 * an account). Returns safe fields or { valid:false, reason }.
 */
export async function getSupervisorInvitation(
  token: string
): Promise<{ valid: boolean; reason?: string; email?: string; name?: string; department?: string | null; university?: string | null }> {
  const { data, error } = await supabase.rpc("get_supervisor_invitation", {
    p_raw_token: (token || "").trim(),
  });
  if (error) throw error;
  return (data || { valid: false, reason: "invalid" }) as {
    valid: boolean;
    reason?: string;
    email?: string;
    name?: string;
    department?: string | null;
    university?: string | null;
  };
}

/**
 * Activates a supervisor invitation token. Resolves the invitation email via
 * RPC, creates the Supabase auth account (email + password), then calls the
 * SECURITY DEFINER function which validates the hashed token, creates /
 * reconnects the SUPERVISOR "User" row, and assigns the supervisor to the
 * internship.
 */
export async function activateSupervisorInvitation(
  token: string,
  name: string,
  password: string
): Promise<{ email: string; supervisorId: string; invitationId: string }> {
  const tokenTrim = (token || "").trim();
  if (!tokenTrim) throw new Error("Missing invitation token.");

  const invite = await getSupervisorInvitation(tokenTrim);
  if (!invite.valid || !invite.email) {
    throw new Error("This invitation link is invalid, expired, or already used.");
  }

  const signUp = await supabase.auth.signUp({
    email: invite.email.trim(),
    password,
    options: { data: { name, role: "SUPERVISOR" } },
  });
  if (signUp.error) throw signUp.error;
  const userId = signUp.data.user?.id;
  if (!userId) throw new Error("Could not create the supervisor account.");

  const { data, error } = await supabase.rpc("activate_supervisor_invitation", {
    p_raw_token: tokenTrim,
    p_user_id: userId,
    p_user_email: invite.email.trim(),
    p_user_name: name,
  });
  if (error) throw error;

  const result = data as { success?: boolean; message?: string; supervisorId?: string; email?: string };
  if (!result?.success) {
    throw new Error(result?.message || "Could not activate the invitation.");
  }
  return {
    email: result.email || invite.email,
    supervisorId: result.supervisorId || userId,
    invitationId: tokenTrim,
  };
}

/** Fetches internships assigned to the current supervisor. */
export async function fetchSupervisorInternships(): Promise<Internship[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from(TABLES.INTERNSHIP)
    .select("*, recruiter:recruiterId(name, company)")
    .eq("supervisorId", user.user.id)
    .order("createdAt", { ascending: false });
  throwIfError(error, "Failed to load assigned internships");
  return (data as Internship[]) || [];
}

/** Fetches reports for the current supervisor's assigned internships. */
export async function fetchSupervisorLogbooks(): Promise<LogbookReport[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const { data: internships } = await supabase
    .from(TABLES.INTERNSHIP)
    .select("id")
    .eq("supervisorId", user.user.id);
  const ids = (internships || []).map((i) => i.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from(TABLES.LOGBOOK_REPORT)
    .select("*, internship:internshipId(id, title), student:studentId(id, name, email, university, major)")
    .in("internshipId", ids)
    .order("createdAt", { ascending: false });
  throwIfError(error, "Failed to load logbook reports");
  return (data as LogbookReport[]) || [];
}

/** Fetches all SUPERVISOR users (admin). */
export async function fetchSupervisors() {
  return fetchUsers("SUPERVISOR");
}

/** Fetches internships assigned to a specific supervisor (admin). */
export async function fetchInternshipsBySupervisor(supervisorId: string): Promise<Internship[]> {
  const { data, error } = await supabase
    .from(TABLES.INTERNSHIP)
    .select("*, recruiter:recruiterId(name, company)")
    .eq("supervisorId", supervisorId)
    .order("createdAt", { ascending: false });
  throwIfError(error, "Failed to load supervisor internships");
  return (data as Internship[]) || [];
}

/** Counts distinct students under a supervisor's internships (admin). */
export async function countStudentsBySupervisor(supervisorId: string): Promise<number> {
  const { data: internships } = await supabase
    .from(TABLES.INTERNSHIP)
    .select("id")
    .eq("supervisorId", supervisorId);
  const ids = (internships || []).map((i) => i.id);
  if (ids.length === 0) return 0;
  const { data, error } = await supabase
    .from(TABLES.APPLICATION)
    .select("studentId")
    .in("internshipId", ids);
  if (error) return 0;
  return new Set((data || []).map((r) => r.studentId)).size;
}

/** Fetches the administration view of supervisors with assignments. */
export async function fetchSupervisorAssignments(): Promise<
  Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    university?: string | null;
    suspended?: boolean;
    createdAt?: string | null;
    internships: Internship[];
    studentCount: number;
  }>
> {
  const supervisors = await fetchSupervisors();
  return Promise.all(
    (supervisors as Array<Record<string, unknown>>).map(async (s) => ({
      id: String(s.id || ""),
      name: (s.name as string | undefined) ?? null,
      email: (s.email as string | undefined) ?? null,
      university: (s.university as string | undefined) ?? null,
      suspended: !!s.suspended,
      createdAt: (s.createdAt as string | undefined) ?? null,
      internships: await fetchInternshipsBySupervisor(String(s.id)),
      studentCount: await countStudentsBySupervisor(String(s.id)),
    }))
  );
}

/** Sends/regenerates a fresh invitation for a supervisor (admin). */
export async function resendSupervisorInvitation(payload: {
  name: string;
  email: string;
  department?: string;
  university?: string;
}): Promise<{ invitation: SupervisorInvitation; activationToken: string }> {
  return createSupervisorInvitation(payload);
}

/** Fetches the distinct students linked to the current supervisor's internships. */
export async function fetchSupervisorStudents(): Promise<
  Array<{
    student: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null };
    internships: Array<{ id: string; title: string }>;
  }>
> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const internships = await fetchSupervisorInternships();
  if (internships.length === 0) return [];

  const ids = internships.map((i) => i.id);
  const { data, error } = await supabase
    .from(TABLES.APPLICATION)
    .select("studentId, internshipId, student:studentId(id, name, email, university, major)")
    .in("internshipId", ids);
  if (error) throw new Error("Failed to load your students.");

  const byStudent = new Map<string, { student: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null }; internships: Array<{ id: string; title: string }> }>();
  const rows = (data as unknown as Array<{
    studentId: string;
    internshipId: string;
    student: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null };
  }>) || [];
  for (const row of rows) {
    const studentRow = row.student;
    if (!studentRow?.id) continue;
    const entry = byStudent.get(studentRow.id) || { student: studentRow, internships: [] };
    const internship = internships.find((i) => i.id === row.internshipId);
    if (internship && !entry.internships.some((x) => x.id === internship.id)) {
      entry.internships.push({ id: internship.id, title: internship.title });
    }
    byStudent.set(studentRow.id, entry);
  }
  return Array.from(byStudent.values());
}

