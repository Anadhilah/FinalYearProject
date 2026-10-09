import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchInternshipCompletionWorkflows,
  transitionInternshipCompletionWorkflow,
  type InternshipCompletionAction,
  type InternshipCompletionWorkflow,
} from "@/services/supabase-api";

type ReportDraft = { summary: string; assessment: string };
type ExtensionDraft = { newEndDate: string; reason: string };

const statusLabels: Record<InternshipCompletionWorkflow["status"], string> = {
  ACTIVE: "Active",
  END_DATE_REACHED: "End date reached",
  EXTENSION_REQUESTED: "Extension awaiting student",
  REPORT_DUE: "Final report due",
  REPORT_SUBMITTED: "Final report submitted",
  CLARIFICATION_REQUESTED: "Clarification requested",
  COMPLETED: "Completed",
};

function displayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function nextDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function InternshipCompletion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<InternshipCompletionWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<Record<string, ExtensionDraft>>({});
  const [earlyEndReasons, setEarlyEndReasons] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Record<string, ReportDraft>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkflows(await fetchInternshipCompletionWorkflows());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load internship completion records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runAction = async (
    workflow: InternshipCompletionWorkflow,
    action: InternshipCompletionAction,
    payload: Record<string, unknown>,
    successMessage: string,
  ) => {
    setWorkingId(workflow.id);
    setError(null);
    try {
      await transitionInternshipCompletionWorkflow(workflow.id, action, payload);
      toast({ title: successMessage });
      await load();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Unable to update this internship.";
      setError(message);
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setWorkingId(null);
    }
  };

  const role = String(user?.role || "").toLowerCase().replace(/_/g, "-");
  const heading = role === "student"
    ? "Internship History & Completion"
    : role === "faculty-coordinator"
      ? "Final Internship Reports"
      : role === "department-coordinator"
        ? "Completed Internships"
        : "Internship Completion";

  const visibleWorkflows = workflows.filter((workflow) =>
    workflow.studentId === user?.id
    || workflow.companySupervisorId === user?.id
    || workflow.facultyCoordinatorId === user?.id
    || workflow.departmentCoordinatorId === user?.id
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">{heading}</h2>
        <p className="text-muted-foreground">Review internship end dates, extensions, and final reports.</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading internship records...</p>
      ) : visibleWorkflows.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No internship completion items yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {visibleWorkflows.map((workflow) => {
            const isSupervisor = workflow.companySupervisorId === user?.id;
            const isStudent = workflow.studentId === user?.id;
            const isFacultyCoordinator = workflow.facultyCoordinatorId === user?.id;
            const isDepartmentCoordinator = workflow.departmentCoordinatorId === user?.id;
            const busy = workingId === workflow.id;
            const extension = extensions[workflow.id] || { newEndDate: "", reason: "" };
            const report = reports[workflow.id] || { summary: "", assessment: "" };
            const isBeforeEndDate = !workflow.currentEndDate || workflow.currentEndDate > new Date().toISOString().slice(0, 10);

            return (
              <Card key={workflow.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{workflow.internshipTitle}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {workflow.studentName} · {workflow.companyName}
                      </p>
                    </div>
                    <Badge variant={workflow.status === "COMPLETED" ? "default" : workflow.status === "END_DATE_REACHED" || workflow.status === "REPORT_DUE" ? "secondary" : "outline"}>
                      {statusLabels[workflow.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <p><span className="text-muted-foreground">End date:</span> {displayDate(workflow.currentEndDate)}</p>
                    {workflow.companySupervisorName && <p><span className="text-muted-foreground">Company supervisor:</span> {workflow.companySupervisorName}</p>}
                    {workflow.facultyCoordinatorName && <p><span className="text-muted-foreground">University reviewer:</span> {workflow.facultyCoordinatorName}</p>}
                  </div>

                  {workflow.status === "END_DATE_REACHED" && (
                    <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-800">
                      The internship period has ended. The company supervisor must end the placement or request an extension.
                    </p>
                  )}

                  {workflow.status === "EXTENSION_REQUESTED" && (
                    <div className="space-y-2 rounded-md border p-3 text-sm">
                      <p className="font-medium">Extension request to {displayDate(workflow.extensionEndDate)}</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">{workflow.extensionReason}</p>
                      {isStudent ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" onClick={() => void runAction(workflow, "ACCEPT_EXTENSION", {}, "Extension accepted")} disabled={busy}>Accept extension</Button>
                          <Button size="sm" variant="outline" onClick={() => void runAction(workflow, "DECLINE_EXTENSION", {}, "Extension declined")} disabled={busy}>Decline extension</Button>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Waiting for the student to respond.</p>}
                    </div>
                  )}

                  {workflow.earlyEndReason && (
                    <div className="rounded-md bg-amber-500/10 p-3 text-sm">
                      <p className="font-medium">Internship ended early</p>
                      <p className="mt-1 whitespace-pre-wrap">{workflow.earlyEndReason}</p>
                    </div>
                  )}

                  {isSupervisor && workflow.status === "ACTIVE" && isBeforeEndDate && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`early-end-reason-${workflow.id}`}>
                          {workflow.currentEndDate ? "Reason for ending before the due date" : "Reason for ending this internship"}
                        </Label>
                        <Textarea
                          id={`early-end-reason-${workflow.id}`}
                          value={earlyEndReasons[workflow.id] || ""}
                          onChange={(event) => setEarlyEndReasons((current) => ({ ...current, [workflow.id]: event.target.value }))}
                          rows={3}
                          maxLength={2000}
                          placeholder={workflow.currentEndDate
                            ? "Provide a clear reason for ending this internship early."
                            : "Provide a clear reason for ending this internship."}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void runAction(
                          workflow,
                          "END_INTERNSHIP_EARLY",
                          { reason: earlyEndReasons[workflow.id] || "" },
                          workflow.currentEndDate
                            ? "Internship ended early; final report is due"
                            : "Internship ended; final report is due",
                        )}
                        disabled={busy || !earlyEndReasons[workflow.id]?.trim()}
                      >{workflow.currentEndDate ? "End internship early" : "End internship"}</Button>
                    </div>
                  )}

                  {isSupervisor && workflow.status === "END_DATE_REACHED" && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void runAction(workflow, "END_INTERNSHIP", {}, "Internship ended; final report is due")} disabled={busy}>End internship</Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_2fr_auto] sm:items-end">
                        <div className="space-y-2">
                          <Label htmlFor={`extension-date-${workflow.id}`}>New end date</Label>
                          <Input
                            id={`extension-date-${workflow.id}`}
                            type="date"
                            min={nextDate(workflow.currentEndDate)}
                            value={extension.newEndDate}
                            onChange={(event) => setExtensions((current) => ({ ...current, [workflow.id]: { ...extension, newEndDate: event.target.value } }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`extension-reason-${workflow.id}`}>Reason for extension</Label>
                          <Input
                            id={`extension-reason-${workflow.id}`}
                            value={extension.reason}
                            onChange={(event) => setExtensions((current) => ({ ...current, [workflow.id]: { ...extension, reason: event.target.value } }))}
                            placeholder="Explain why more time is needed"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void runAction(workflow, "REQUEST_EXTENSION", extension, "Extension request sent to the student")}
                          disabled={busy || !extension.newEndDate || !extension.reason.trim()}
                        >Request extension</Button>
                      </div>
                    </div>
                  )}

                  {isSupervisor && (workflow.status === "REPORT_DUE" || workflow.status === "CLARIFICATION_REQUESTED") && (
                    <div className="space-y-3 border-t pt-4">
                      {workflow.status === "CLARIFICATION_REQUESTED" && workflow.reviewComment && (
                        <p className="rounded-md bg-amber-500/10 p-3 text-sm">Reviewer clarification: {workflow.reviewComment}</p>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor={`report-summary-${workflow.id}`}>Final internship report</Label>
                        <Textarea
                          id={`report-summary-${workflow.id}`}
                          value={report.summary}
                          onChange={(event) => setReports((current) => ({ ...current, [workflow.id]: { ...report, summary: event.target.value } }))}
                          rows={4}
                          placeholder="Summarize the work, outcomes, and skills developed during the internship."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`report-assessment-${workflow.id}`}>Supervisor assessment</Label>
                        <Textarea
                          id={`report-assessment-${workflow.id}`}
                          value={report.assessment}
                          onChange={(event) => setReports((current) => ({ ...current, [workflow.id]: { ...report, assessment: event.target.value } }))}
                          rows={4}
                          placeholder="Provide your final assessment of the student's performance."
                        />
                      </div>
                      <Button size="sm" onClick={() => void runAction(workflow, "SUBMIT_FINAL_REPORT", report, "Final report submitted")} disabled={busy || !report.summary.trim() || !report.assessment.trim()}>
                        {busy ? "Submitting..." : "Submit final report"}
                      </Button>
                    </div>
                  )}

                  {(workflow.status === "REPORT_SUBMITTED" || workflow.status === "COMPLETED") && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="rounded-md border p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Final report</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{workflow.reportSummary}</p>
                        <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Supervisor assessment</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{workflow.reportAssessment}</p>
                      </div>
                      {isStudent && workflow.status === "REPORT_SUBMITTED" && !workflow.studentAcknowledgedAt && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Acknowledge that you have read this report. Your acknowledgement does not change the supervisor&apos;s assessment.</p>
                          <Button size="sm" onClick={() => void runAction(workflow, "ACKNOWLEDGE_REPORT", {}, "Report acknowledged")} disabled={busy}>Acknowledge report</Button>
                        </div>
                      )}
                      {isStudent && workflow.studentAcknowledgedAt && <p className="text-sm text-muted-foreground">You acknowledged this report on {new Date(workflow.studentAcknowledgedAt).toLocaleDateString()}.</p>}
                      {isFacultyCoordinator && workflow.status === "REPORT_SUBMITTED" && (
                        workflow.studentAcknowledgedAt ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`review-comment-${workflow.id}`}>Review comment</Label>
                              <Textarea id={`review-comment-${workflow.id}`} value={reviewComments[workflow.id] ?? ""} onChange={(event) => setReviewComments((current) => ({ ...current, [workflow.id]: event.target.value }))} rows={3} placeholder="Add a comment or clarification request" />
                            </div>
                            {workflow.reviewComment && <p className="whitespace-pre-wrap text-sm text-muted-foreground">Previous review comments: {workflow.reviewComment}</p>}
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => void runAction(workflow, "APPROVE_REPORT", { comment: reviewComments[workflow.id] || "" }, "Report approved; internship completed")} disabled={busy}>Approve and complete</Button>
                              <Button size="sm" variant="outline" onClick={() => void runAction(workflow, "REQUEST_CLARIFICATION", { comment: reviewComments[workflow.id] || "" }, "Clarification requested")} disabled={busy || !reviewComments[workflow.id]?.trim()}>Request clarification</Button>
                              <Button size="sm" variant="ghost" onClick={() => void runAction(workflow, "COMMENT_ON_REPORT", { comment: reviewComments[workflow.id] || "" }, "Review comment added")} disabled={busy || !reviewComments[workflow.id]?.trim()}>Add comment</Button>
                            </div>
                          </div>
                        ) : <p className="text-sm text-muted-foreground">Waiting for the student to acknowledge the report before review.</p>
                      )}
                      {isFacultyCoordinator && workflow.status === "COMPLETED" && workflow.reviewComment && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">Review comments: {workflow.reviewComment}</p>
                      )}
                      {isDepartmentCoordinator && workflow.status === "COMPLETED" && (
                        <p className="rounded-md bg-success/10 p-3 text-sm text-success">This internship has completed university review and is now part of the student&apos;s internship history.</p>
                      )}
                    </div>
                  )}

                  {isFacultyCoordinator && workflow.status === "CLARIFICATION_REQUESTED" && (
                    <p className="text-sm text-muted-foreground">Waiting for the company supervisor to update and resubmit the report.</p>
                  )}
                  {isSupervisor && workflow.status === "REPORT_SUBMITTED" && (
                    <p className="text-sm text-muted-foreground">Final report submitted. Waiting for the student acknowledgement and university review.</p>
                  )}
                  {isStudent && workflow.status === "COMPLETED" && (
                    <p className="text-sm text-muted-foreground">Completed on {displayDate(workflow.completedAt)} · Report approved by {workflow.facultyCoordinatorName || "your university reviewer"}.</p>
                  )}
                  {isDepartmentCoordinator && workflow.status !== "COMPLETED" && (
                    <p className="text-sm text-muted-foreground">Completion is in progress. You&apos;ll see this placement here after university approval.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}