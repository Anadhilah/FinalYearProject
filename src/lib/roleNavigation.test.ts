import { describe, it, expect } from "vitest";
import { getRoleDashboardPath } from "./roleNavigation";

describe("getRoleDashboardPath", () => {
  it("maps student role to /student", () => {
    expect(getRoleDashboardPath("student")).toBe("/student");
  });

  it("maps recruiter role to /recruiter", () => {
    expect(getRoleDashboardPath("recruiter")).toBe("/recruiter");
  });

  it("maps supervisor role to /supervisor", () => {
    expect(getRoleDashboardPath("supervisor")).toBe("/supervisor");
  });

  it("maps admin role to /admin", () => {
    expect(getRoleDashboardPath("admin")).toBe("/admin");
  });

  it("is case-insensitive", () => {
    expect(getRoleDashboardPath("STUDENT")).toBe("/student");
    expect(getRoleDashboardPath("Recruiter")).toBe("/recruiter");
    expect(getRoleDashboardPath("SUPERVISOR")).toBe("/supervisor");
    expect(getRoleDashboardPath("ADMIN")).toBe("/admin");
  });

  it("falls back to / for unknown roles", () => {
    expect(getRoleDashboardPath("superuser")).toBe("/");
    expect(getRoleDashboardPath("")).toBe("/");
  });

  it("handles null and undefined gracefully", () => {
    expect(getRoleDashboardPath(null)).toBe("/");
    expect(getRoleDashboardPath(undefined)).toBe("/");
  });
});
