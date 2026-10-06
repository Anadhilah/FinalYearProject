import { describe, expect, it } from "vitest";
import {
  normalizeApplicationStatus,
  isOfferDecisionRequired,
  getApplicationBadgeStatus,
} from "./applicationStatus";

describe("application status helpers", () => {
  it("normalizes offer-related statuses consistently", () => {
    expect(normalizeApplicationStatus("offer_sent")).toBe("OFFER_SENT");
    expect(normalizeApplicationStatus("offer_accepted")).toBe("OFFER_ACCEPTED");
    expect(normalizeApplicationStatus("offer_declined")).toBe("OFFER_DECLINED");
  });

  it("requires a student decision only for offer sent applications", () => {
    expect(isOfferDecisionRequired("OFFER_SENT")).toBe(true);
    expect(isOfferDecisionRequired("PENDING")).toBe(false);
    expect(isOfferDecisionRequired("ACCEPTED")).toBe(false);
  });

  it("maps the student offer decision statuses to the right badge states", () => {
    expect(getApplicationBadgeStatus("OFFER_SENT")).toBe("offer_sent");
    expect(getApplicationBadgeStatus("OFFER_ACCEPTED")).toBe("accepted");
    expect(getApplicationBadgeStatus("OFFER_DECLINED")).toBe("rejected");
  });
});
