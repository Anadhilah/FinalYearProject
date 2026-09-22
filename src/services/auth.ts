/**
 * Supabase-backed API compatibility layer.
 *
 * These functions preserve the old `apiAuthenticationService*` signatures used
 * across the app, but route all data access through Supabase instead of a
 * manual REST backend. Auth/session is managed entirely by `supabase.auth`.
 */
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/siteUrl";
import {
  fetchInternships,
  fetchInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  fetchMyApplications,
  fetchDepartmentCoordinatorApplications,
  fetchAvailableDepartmentCoordinators,
  createApplication,
  updateApplicationStatus,
  reviewDepartmentApplication,
  fetchDepartmentCoordinatorStudentsData,
  assignDepartmentStudentFacultyCoordinator,
  fetchDepartmentCoordinatorOrganisationsData,
  fetchDepartmentCoordinatorReportsData,
  fetchFacultyCoordinatorReportsData,
  fetchLogbookReports,
  createLogbookReport,
  reviewLogbookReport,
  reviewLogbookAsSupervisor,
  generateShareToken,
  fetchSharedReport,
  fetchAdminStats,
  fetchRecentActivity,
  fetchUsers,
  updateUser,
  createSupervisorInvitation,
  fetchMySupervisorInvitations,
  activateSupervisorInvitation,
  fetchSupervisorInternships,
  fetchSupervisorLogbooks,
  fetchSupervisors,
  fetchMeetings,
  createMeeting,
  uploadFile,
  getSignedFileUrl,
  getPublicFileUrl,
} from "./supabase-api";

/** Legacy-compatible response shape (`{ data, status, statusText }`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApiResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  status: number;
  statusText: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap(data: any): ApiResult {
  return { data, status: 200, statusText: "OK" };
}

export const apiAuthenticationServiceGet = async (url: string): Promise<ApiResult> => {
  switch (true) {
    case url === "/internships":
      return wrap(await fetchInternships());
    case url === "/internships/mine":
      return wrap(await fetchInternships(true));
    case /^\/internships\/[^/]+$/.test(url):
      return wrap(await fetchInternshipById(url.split("/")[2]));
    case url === "/applications-list/mine":
      return wrap(await fetchMyApplications());
    case url === "/department-coordinator/internship-approval":
      return wrap(await fetchDepartmentCoordinatorApplications());
    case url === "/department-coordinators/available":
      return wrap(await fetchAvailableDepartmentCoordinators());
    case url === "/department-coordinator/students":
      return wrap(await fetchDepartmentCoordinatorStudentsData());
    case url === "/department-coordinator/organisations":
      return wrap(await fetchDepartmentCoordinatorOrganisationsData());
    case url === "/department-coordinator/reports":
      return wrap(await fetchDepartmentCoordinatorReportsData());
    case url === "/faculty-coordinator/reports":
      return wrap(await fetchFacultyCoordinatorReportsData());
    case /^\/applications-list\/[^/]+\/resume-url$/.test(url): {
      const appId = url.split("/")[2];
      const { data: app } = await supabase
        .from("Application")
        .select("resumeUrl")
        .eq("id", appId)
        .single();
      const path = app?.resumeUrl;
      if (!path) return wrap({ url: "" });
      const signedUrl = await getSignedFileUrl(path);
      return wrap({ url: signedUrl });
    }
    case /^\/applications-list\/[^/]+\/cover-letter-url$/.test(url): {
      const appId = url.split("/")[2];
      const { data: app } = await supabase
        .from("Application")
        .select("coverLetterUrl")
        .eq("id", appId)
        .single();
      const path = app?.coverLetterUrl;
      if (!path) return wrap({ url: "" });
      const signedUrl = await getSignedFileUrl(path);
      return wrap({ url: signedUrl });
    }
    case /^\/users\/[^/]+\/proof-doc-url$/.test(url): {
      const userId = url.split("/")[2];
      const { data: profile } = await supabase
        .from("User")
        .select("proofDocUrl")
        .eq("id", userId)
        .single();
      const path = profile?.proofDocUrl;
      if (!path) return wrap({ url: "" });
      const signedUrl = await getSignedFileUrl(path);
      return wrap({ url: signedUrl });
    }
    case /^\/users\/me\/cv-url$/.test(url): {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error("Not signed in.");
      const { data: profile } = await supabase
        .from("User")
        .select("cvUrl")
        .eq("id", user.user.id)
        .single();
      const path = profile?.cvUrl;
      if (!path) return wrap({ url: "" });
      const signedUrl = await getSignedFileUrl(path);
      return wrap({ url: signedUrl });
    }
    case url === "/auth/me": {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error("Not signed in.");
      const { data: profile } = await supabase
        .from("User")
        .select("*")
        .eq("id", user.user.id)
        .single();
      return wrap(profile || {});
    }
    case url === "/pages/get-users":
      return wrap(await fetchUsers());
    case url === "/logbooks/student":
    case url === "/logbooks/recruiter":
      return wrap(await fetchLogbookReports());
    case /^\/logbooks\/share\/[^/]+$/.test(url):
      return wrap(await fetchSharedReport(url.split("/")[3]));
    case url === "/admin/stats":
      return wrap(await fetchAdminStats());
    case url === "/admin/recent-activity":
      return wrap(await fetchRecentActivity());
    case url === "/users":
      return wrap(await fetchUsers());
    case url === "/users?role=RECRUITER":
      return wrap(await fetchUsers("RECRUITER"));
    case url === "/supervisors":
      return wrap(await fetchSupervisors());
    case url === "/supervisor/invitations":
      return wrap(await fetchMySupervisorInvitations());
    case url === "/supervisor/internships":
      return wrap(await fetchSupervisorInternships());
    case url === "/supervisor/logbooks":
      return wrap(await fetchSupervisorLogbooks());
    case url === "/logbooks/supervisor":
      return wrap(await fetchSupervisorLogbooks());
    case url === "/meetings":
      return wrap(await fetchMeetings());
    default:
      throw new Error(`Unhandled GET endpoint: ${url}`);
  }
};

export const apiAuthenticationServicePost = async (url: string, data?: unknown): Promise<ApiResult> => {
  switch (true) {
    case url === "/internships":
      return wrap(await createInternship((data as Record<string, unknown>) || {}));
    case url === "/applications-list": {
      const d = (data || {}) as {
        internshipId: string;
        coverLetter?: string;
        resumeUrl?: string;
        coverLetterUrl?: string;
        coordinatorSupportRequested?: boolean;
        departmentCoordinatorId?: string;
        skills?: string[];
        startDate?: string;
        endDate?: string;
        questionAnswers?: Array<{ question: string; answer: string }>;
      };
      return wrap(
        await createApplication({
          internshipId: d.internshipId,
          coverLetter: d.coverLetter,
          resumeUrl: d.resumeUrl,
          coverLetterUrl: d.coverLetterUrl,
          coordinatorSupportRequested: d.coordinatorSupportRequested,
          departmentCoordinatorId: d.departmentCoordinatorId,
          skills: d.skills,
          startDate: d.startDate,
          endDate: d.endDate,
          questionAnswers: d.questionAnswers,
        })
      );
    }
    case /^\/upload\/.+$/.test(url): {
      const file = data instanceof FormData
        ? data.get("file")
        : (data as { file?: File } | undefined)?.file;
      if (!(file instanceof File)) {
        throw new Error("No file was provided for upload.");
      }
      const path = await uploadFile(file);
      return wrap({ path });
    }
    case url === "/logbooks":
      return wrap(await createLogbookReport((data as Record<string, unknown>) || {}));
    case url === "/supervisor/invitations": {
      const payload = (data || {}) as {
        name: string;
        email: string;
        department?: string;
        university?: string;
        phone?: string;
        internshipId?: string;
      };
      return wrap(await createSupervisorInvitation(payload));
    }
    case url === "/supervisor/invitations/activate": {
      const { token, name, password } = (data || {}) as {
        token: string;
        name: string;
        password: string;
      };
      return wrap(await activateSupervisorInvitation(token, name, password));
    }
    case /^\/logbooks\/[^/]+\/supervisor-comment$/.test(url): {
      const reportId = url.split("/")[2];
      const { status, comment } = (data || {}) as { status: string; comment?: string };
      await reviewLogbookAsSupervisor(reportId, status, comment);
      return wrap({ success: true });
    }
    case /^\/logbooks\/[^/]+\/comment$/.test(url): {
      const reportId = url.split("/")[2];
      const { status, recruiterComment } = (data || {}) as { status: string; recruiterComment?: string };
      await reviewLogbookReport(reportId, status, recruiterComment);
      return wrap({ success: true });
    }
    case /^\/logbooks\/[^/]+\/share$/.test(url): {
      const reportId = url.split("/")[2];
      const token = await generateShareToken(reportId);
      const shareLink = `${SITE_URL}/shared/${token}`;
      return wrap({ shareLink });
    }
case url === "/meetings":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return wrap(await createMeeting((data as any) || {}));
    default:
      throw new Error(`Unhandled POST endpoint: ${url}`);
  }
};

export const apiAuthenticationServicePut = async (url: string, data?: unknown): Promise<ApiResult> => {
  switch (true) {
    case /^\/internships\/[^/]+$/.test(url):
      await updateInternship(url.split("/")[2], (data as Record<string, unknown>) || {});
      return wrap({ success: true });
    case /^\/applications-list\/[^/]+\/status$/.test(url): {
      const id = url.split("/")[2];
      const { status } = (data || {}) as { status: string };
      await updateApplicationStatus(id, status);
      return wrap({ success: true });
    }
    case /^\/department-coordinator\/internship-approval\/[^/]+\/review$/.test(url): {
      const id = url.split("/")[3];
      const { decision } = (data || {}) as { decision: "approved" | "rejected" };
      await reviewDepartmentApplication(id, decision === "approved" ? "APPROVED" : "REJECTED");
      return wrap({ success: true });
    }
    case /^\/department-coordinator\/students\/[^/]+\/faculty-coordinator$/.test(url): {
      const studentId = url.split("/")[3];
      const { coordinatorId } = (data || {}) as { coordinatorId: string | null };
      await assignDepartmentStudentFacultyCoordinator(studentId, coordinatorId);
      return wrap({ success: true });
    }
    case /^\/users\/[^/]+$/.test(url):
      await updateUser(url.split("/")[2], (data as Record<string, unknown>) || {});
      return wrap({ success: true });
    default:
      throw new Error(`Unhandled PUT endpoint: ${url}`);
  }
};

export const apiAuthenticationServiceDelete = async (url: string): Promise<ApiResult> => {
  switch (true) {
    case /^\/internships\/[^/]+$/.test(url):
      await deleteInternship(url.split("/")[2]);
      return wrap({ success: true });
    default:
      throw new Error(`Unhandled DELETE endpoint: ${url}`);
  }
};

// Re-export file helpers for convenience.
export { getPublicFileUrl, getSignedFileUrl, uploadFile, supabase };
