import { describe, expect, it } from "vitest";
import { getApiBaseUrl } from "./api";

describe("getApiBaseUrl", () => {
  it("returns an empty string because Supabase is the data source (no manual backend)", () => {
    expect(getApiBaseUrl()).toBe("");
  });
});
