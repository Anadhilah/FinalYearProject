/**
 * Supabase-backed API compatibility layer.
 *
 * This module previously wrapped axios to a manual REST backend. It now routes
 * all data access through Supabase while preserving the `api.get/post/put/
 * delete` call signatures used across the app (each returns `{ data, ... }`).
 */
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
  fetchUsers,
fetchMeetings,
  createMeeting,
  uploadFile,
  getSignedFileUrl,
  type Meeting,
} from "@/services/supabase-api";

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

function wrap<T>(data: T): ApiResponse<T> {
  return { data, status: 200, statusText: "OK" };
}

async function routeGet(url: string): Promise<ApiResponse<unknown>> {
  switch (true) {
    case url === "/internships":
      return wrap(await fetchInternships());
    case /^\/internships\/[^/]+$/.test(url):
      return wrap(await fetchInternshipById(url.split("/")[2]));
    case url === "/applications-list/mine":
      return wrap(await fetchMyApplications());
    case url === "/logbooks/student":
    case url === "/logbooks/recruiter":
      return wrap(await fetchLogbookReports());
case /^\/logbooks\/share\/[^/]+$/.test(url):
      return wrap(await fetchSharedReport(url.split("/")[3]));
    case /^\/logbooks\/export\/[^/]+$/.test(url): {
      const internshipId = url.split("/")[3];
      const internship = await fetchInternshipById(internshipId);
      const reports = (await fetchLogbookReports()).filter((r) => r.internshipId === internshipId);
      return wrap({ internship, reports });
    }
    case url === "/users":
      return wrap(await fetchUsers());
    case url === "/meetings":
      return wrap(await fetchMeetings());
    default:
      throw new Error(`Unhandled GET endpoint: ${url}`);
  }
}

async function routePost(url: string, data?: unknown): Promise<ApiResponse<unknown>> {
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
      return wrap({ shareLink: `${window.location.origin}/shared/${token}` });
    }
    case /^\/upload\/.+$/.test(url): {
      const { file } = (data || {}) as { file: File };
      const path = await uploadFile(file);
      return wrap({ path });
    }
    case url === "/meetings":
      return wrap(await createMeeting((data as Omit<Meeting, "id" | "createdAt">) || ({} as Omit<Meeting, "id" | "createdAt">)));
    default:
      throw new Error(`Unhandled POST endpoint: ${url}`);
  }
}

async function routePut(url: string, data?: unknown): Promise<ApiResponse<unknown>> {
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
    default:
      throw new Error(`Unhandled PUT endpoint: ${url}`);
  }
}

async function routeDelete(url: string): Promise<ApiResponse<unknown>> {
  switch (true) {
    case /^\/internships\/[^/]+$/.test(url):
      await deleteInternship(url.split("/")[2]);
      return wrap({ success: true });
    default:
      throw new Error(`Unhandled DELETE endpoint: ${url}`);
  }
}

const api = {
  get: <T = unknown>(url: string, _config?: unknown) =>
    Promise.resolve(routeGet(url) as Promise<ApiResponse<T>>),
  post: <T = unknown>(url: string, data?: unknown, _config?: unknown) =>
    Promise.resolve(routePost(url, data) as Promise<ApiResponse<T>>),
  put: (url: string, data?: unknown, _config?: unknown) =>
    Promise.resolve(routePut(url, data)),
  delete: (url: string, _config?: unknown) =>
    Promise.resolve(routeDelete(url)),
};

export default api;

export const getApiBaseUrl = () => {
  // No manual backend base URL anymore — Supabase is the data source.
  return "";
};

export { getSignedFileUrl };
