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

  it("maps company supervisor aliases to /supervisor", () => {
    expect(getRoleDashboardPath("company-supervisor")).toBe("/supervisor");
    expect(getRoleDashboardPath("company-internship-supervisor")).toBe("/supervisor");
  });

  it("maps faculty and department coordinator roles", () => {
    expect(getRoleDashboardPath("faculty-coordinator")).toBe("/faculty-coordinator");
    expect(getRoleDashboardPath("department-coordinator")).toBe("/department-coordinator");
    expect(getRoleDashboardPath("Faculty Coordinator")).toBe("/faculty-coordinator");
    expect(getRoleDashboardPath("Department Coordinator")).toBe("/department-coordinator");
  });

  it("maps space-separated supervisor aliases", () => {
    expect(getRoleDashboardPath("Company Supervisor")).toBe("/supervisor");
    expect(getRoleDashboardPath("Company Internship Supervisor")).toBe("/supervisor");
  });

  it("maps admin role to /admin", () => {
    expect(getRoleDashboardPath("admin")).toBe("/admin");
  });

  it("is case-insensitive", () => {
    expect(getRoleDashboardPath("STUDENT")).toBe("/student");
    expect(getRoleDashboardPath("Recruiter")).toBe("/recruiter");
    expect(getRoleDashboardPath("SUPERVISOR")).toBe("/supervisor");
    expect(getRoleDashboardPath("ADMIN")).toBe("/admin");
    expect(getRoleDashboardPath("FACULTY-COORDINATOR")).toBe("/faculty-coordinator");
    expect(getRoleDashboardPath("DEPARTMENT-COORDINATOR")).toBe("/department-coordinator");
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
