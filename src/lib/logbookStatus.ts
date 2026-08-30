/**
 * Multi-stage logbook workflow statuses.
 *
 * The student -> recruiter -> supervisor workflow uses these statuses. We
 * reuse the legacy DRAFT / SUBMITTED / APPROVED / REQUESTED_CHANGES values
 * where they map one-to-one, and add the explicit supervisor stages.
 */
export const LOGBOOK_STATUS = {
  DRAFT: "DRAFT",
  /** Submitted by the student, awaiting the recruiter. */
  SUBMITTED: "SUBMITTED",
  /** Awaiting the recruiter (alias of SUBMITTED). */
  PENDING_RECRUITER_REVIEW: "PENDING_RECRUITER_REVIEW",
  /** Recruiter asked the student for changes. */
  RECRUITER_CHANGES_REQUESTED: "RECRUITER_CHANGES_REQUESTED",
  /** Recruiter approved, forwarded to the supervisor. */
  RECRUITER_APPROVED: "RECRUITER_APPROVED",
  /** Awaiting the university supervisor's review. */
  PENDING_SUPERVISOR_REVIEW: "PENDING_SUPERVISOR_REVIEW",
  /** Supervisor asked the student for changes. */
  SUPERVISOR_CHANGES_REQUESTED: "SUPERVISOR_CHANGES_REQUESTED",
  /** Supervisor approved the report. */
  SUPERVISOR_APPROVED: "SUPERVISOR_APPROVED",
  /** Final state reached. */
  COMPLETED: "COMPLETED",
  /** Legacy: fully approved. */
  APPROVED: "APPROVED",
  /** Legacy: recruiter requested changes. */
  REQUESTED_CHANGES: "REQUESTED_CHANGES",
} as const;

export type LogbookStatusValue = (typeof LOGBOOK_STATUS)[keyof typeof LOGBOOK_STATUS];

/** Friendly labels for display in the UI. */
export const LOGBOOK_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending Recruiter Review",
  PENDING_RECRUITER_REVIEW: "Pending Recruiter Review",
  RECRUITER_CHANGES_REQUESTED: "Recruiter Requested Changes",
  RECRUITER_APPROVED: "Recruiter Approved",
  PENDING_SUPERVISOR_REVIEW: "Pending Supervisor Review",
  SUPERVISOR_CHANGES_REQUESTED: "Supervisor Requested Changes",
  SUPERVISOR_APPROVED: "Supervisor Approved",
  COMPLETED: "Completed",
  APPROVED: "Approved",
  REQUESTED_CHANGES: "Recruiter Requested Changes",
};

/** Statuses the recruiter can act on (request changes / approve). */
export const RECRUITER_ACTIONABLE = new Set<string>([
  LOGBOOK_STATUS.SUBMITTED,
  LOGBOOK_STATUS.PENDING_RECRUITER_REVIEW,
  LOGBOOK_STATUS.RECRUITER_CHANGES_REQUESTED,
]);

/** Statuses the supervisor can act on (request changes / approve). */
export const SUPERVISOR_ACTIONABLE = new Set<string>([
  LOGBOOK_STATUS.PENDING_SUPERVISOR_REVIEW,
]);

/** Statuses that still need the recruiter after a supervisor requests changes. */
export const RECRUITER_REVIEW_NEEDED = new Set<string>([
  LOGBOOK_STATUS.SUPERVISOR_CHANGES_REQUESTED,
]);

/** Statuses visible in the student list (all). */
export const STUDENT_VISIBLE = new Set<string>([
  LOGBOOK_STATUS.DRAFT,
  LOGBOOK_STATUS.SUBMITTED,
  LOGBOOK_STATUS.PENDING_RECRUITER_REVIEW,
  LOGBOOK_STATUS.RECRUITER_CHANGES_REQUESTED,
  LOGBOOK_STATUS.RECRUITER_APPROVED,
  LOGBOOK_STATUS.PENDING_SUPERVISOR_REVIEW,
  LOGBOOK_STATUS.SUPERVISOR_CHANGES_REQUESTED,
  LOGBOOK_STATUS.SUPERVISOR_APPROVED,
  LOGBOOK_STATUS.COMPLETED,
  LOGBOOK_STATUS.APPROVED,
  LOGBOOK_STATUS.REQUESTED_CHANGES,
]);

/** Maps a status to a tailwind badge class. */
export function logbookBadgeClass(status: string): string {
  switch (status) {
    case LOGBOOK_STATUS.SUPERVISOR_APPROVED:
    case LOGBOOK_STATUS.APPROVED:
    case LOGBOOK_STATUS.COMPLETED:
      return "bg-success/10 text-success border-success/20";
    case LOGBOOK_STATUS.RECRUITER_APPROVED:
    case LOGBOOK_STATUS.SUBMITTED:
    case LOGBOOK_STATUS.PENDING_RECRUITER_REVIEW:
    case LOGBOOK_STATUS.PENDING_SUPERVISOR_REVIEW:
      return "bg-primary/10 text-primary border-primary/20";
    case LOGBOOK_STATUS.RECRUITER_CHANGES_REQUESTED:
    case LOGBOOK_STATUS.SUPERVISOR_CHANGES_REQUESTED:
    case LOGBOOK_STATUS.REQUESTED_CHANGES:
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
