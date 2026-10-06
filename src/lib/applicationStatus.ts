export type ApplicationBadgeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reviewing"
  | "department_review"
  | "offer_sent";

export function normalizeApplicationStatus(status?: string | null): string {
  const normalized = (status ?? "").trim();
  return normalized ? normalized.toUpperCase() : "PENDING";
}

export function isOfferDecisionRequired(status?: string | null): boolean {
  return normalizeApplicationStatus(status) === "OFFER_SENT";
}

export function getApplicationBadgeStatus(
  status?: string | null,
  departmentApprovalRequired = false,
): ApplicationBadgeStatus {
  if (departmentApprovalRequired) return "department_review";

  switch (normalizeApplicationStatus(status)) {
    case "OFFER_SENT":
      return "offer_sent";
    case "OFFER_ACCEPTED":
    case "ACCEPTED":
      return "accepted";
    case "OFFER_DECLINED":
    case "REJECTED":
      return "rejected";
    case "REVIEWING":
      return "reviewing";
    default:
      return "pending";
  }
}
