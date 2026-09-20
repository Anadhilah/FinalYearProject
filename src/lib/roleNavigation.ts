import { UserRole } from "@/contexts/AuthContext";

/**
 * Maps a user role to its corresponding dashboard route.
 * Roles are expected to be lowercase ("student" | "recruiter" | "admin" | "supervisor" | "faculty-coordinator").
 * Falls back to the landing page for unknown roles.
 */
export function getRoleDashboardPath(role: string | UserRole | null | undefined): string {
  switch ((role ?? "").toLowerCase()) {
    case "student":
      return "/student";
    case "recruiter":
      return "/recruiter";
    case "supervisor":
      return "/supervisor";
    case "admin":
      return "/admin";
    case "faculty-coordinator":
      return "/faculty-coordinator";
    case "department-coordinator":
      return "/department-coordinator";
    default:
      return "/";
  }
}
