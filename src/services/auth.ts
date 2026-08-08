/**
 * Supabase-backed API compatibility layer.
 *
 * These functions preserve the old `apiAuthenticationService*` signatures used
 * across the app, but route all data access through Supabase instead of a
 * manual REST backend. Auth/session is managed entirely by `supabase.auth`.
 */
import { supabase } from "@/lib/supabaseClient";
import {
  fetchInternships,
  fetchInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  fetchMyApplications,
  createApplication,
  updateApplicationStatus,
  fetchLogbookReports,
  createLogbookReport,
  reviewLogbookReport,
  generateShareToken,
  fetchSharedReport,
  fetchAdminStats,
  fetchRecentActivity,
  fetchUsers,
  updateUser,
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
      const { internshipId, coverLetter, resumeUrl } = (data || {}) as {
        internshipId: string;
        coverLetter?: string;
        resumeUrl?: string;
      };
      return wrap(await createApplication({ internshipId, coverLetter, resumeUrl }));
    }
    case /^\/upload\/.+$/.test(url): {
      const { file } = (data || {}) as { file: File };
      const path = await uploadFile(file);
      return wrap({ path });
    }
    case url === "/logbooks":
      return wrap(await createLogbookReport((data as Record<string, unknown>) || {}));
    case /^\/logbooks\/[^/]+\/comment$/.test(url): {
      const reportId = url.split("/")[2];
      const { status, recruiterComment } = (data || {}) as { status: string; recruiterComment?: string };
      await reviewLogbookReport(reportId, status, recruiterComment);
      return wrap({ success: true });
    }
    case /^\/logbooks\/[^/]+\/share$/.test(url): {
      const reportId = url.split("/")[2];
      const token = await generateShareToken(reportId);
      const shareLink = `${window.location.origin}/shared/${token}`;
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
