import { UserRole } from "@/contexts/AuthContext";

/**
 * Maps a user role to its corresponding dashboard route.
 * Roles are expected to be lowercase ("student" | "recruiter" | "admin").
 * Falls back to the landing page for unknown roles.
 */
export function getRoleDashboardPath(role: string | UserRole | null | undefined): string {
  switch ((role ?? "").toLowerCase()) {
    case "student":
      return "/student";
    case "recruiter":
      return "/recruiter";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
