import { describe, expect, it } from "vitest";
import { PUBLIC_REGISTRATION_ROLES, normalizePublicRegistrationRole } from "./registration";

describe("public registration roles", () => {
  it("includes department coordinator as a public signup option", () => {
    expect(PUBLIC_REGISTRATION_ROLES).toContain("student");
    expect(PUBLIC_REGISTRATION_ROLES).toContain("recruiter");
    expect(PUBLIC_REGISTRATION_ROLES).toContain("department-coordinator");
  });

  it("normalizes coordinator role labels", () => {
    expect(normalizePublicRegistrationRole("Department Coordinator")).toBe("department-coordinator");
    expect(normalizePublicRegistrationRole("DEPARTMENT-COORDINATOR")).toBe("department-coordinator");
  });
});
