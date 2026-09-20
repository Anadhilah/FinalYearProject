export type PublicRegistrationRole = "student" | "recruiter" | "department-coordinator";

export const PUBLIC_REGISTRATION_ROLES: PublicRegistrationRole[] = [
  "student",
  "recruiter",
  "department-coordinator",
];

export function normalizePublicRegistrationRole(
  role: string | null | undefined
): PublicRegistrationRole | "unknown" {
  const normalized = (role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

  switch (normalized) {
    case "student":
      return "student";
    case "recruiter":
      return "recruiter";
    case "department-coordinator":
    case "department coordinator":
      return "department-coordinator";
    default:
      return "unknown";
  }
}
