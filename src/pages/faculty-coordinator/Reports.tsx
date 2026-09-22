import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { useMessages } from "@/contexts/MessagesContext";
import {
  acceptFacultyCoordinatorReport,
  FacultyCoordinatorReportRow,
  FacultyCoordinatorReportsData,
  fetchFacultyCoordinatorReportsData,
  fetchAvailableDepartmentCoordinators,
  sendFacultyCoordinatorReportToDepartment,
} from "@/services/supabase-api";
import { startConversation } from "@/services/chat";
import { LOGBOOK_STATUS_LABELS, logbookBadgeClass } from "@/lib/logbookStatus";

function ReportCard({
  report,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  forwardMessage,
  departmentCoordinatorId,
  departmentCoordinators,
  onCoordinatorChange,
  onMessageChange,
  onForward,
}: {
  report: FacultyCoordinatorReportRow;
  action: () => void;
  actionLabel: string;
  actionIcon: typeof Send;
  forwardMessage?: string;
  departmentCoordinatorId?: string;
  departmentCoordinators?: Array<{ id: string; name: string }>;
  onCoordinatorChange?: (value: string) => void;
  onMessageChange?: (value: string) => void;
  onForward?: () => void;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {report.studentName} · Week {report.weekNumber}
          </span>
          <Badge variant="outline" className={logbookBadgeClass(report.status)}>
            {LOGBOOK_STATUS_LABELS[report.status] || report.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2 text-muted-foreground">
          <span>{report.department}</span>
          <span>{report.organisation}</span>
          <span>{report.internshipTitle}</span>
          <span>Submitted {report.submittedAt}</span>
        </div>
        <div className="space-y-1">
          <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
          <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
          <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
          <p><span className="font-medium">Hours:</span> {report.hoursWorked || "—"}</p>
        </div>
        {report.supervisorComment && (
          <p className="rounded-lg border bg-muted/30 p-2 text-muted-foreground">
            <span className="font-medium text-foreground">Organisation supervisor review:</span> {report.supervisorComment}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Department coordinator: {report.departmentCoordinator}
          </span>
          <Button size="sm" onClick={action}>
            <ActionIcon className="mr-1.5 h-4 w-4" /> {actionLabel}
          </Button>
        </div>
        {departmentCoordinators && onCoordinatorChange && onMessageChange && (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">Forward a typed report message</p>
            <select
              value={departmentCoordinatorId || ""}
              onChange={(event) => onCoordinatorChange(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select department coordinator</option>
              {departmentCoordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>{coordinator.name}</option>
              ))}
            </select>
            <Textarea
              value={forwardMessage || ""}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="Type a message to send with this report..."
              rows={3}
            />
            <Button size="sm" variant="secondary" onClick={onForward} disabled={!departmentCoordinatorId || !forwardMessage?.trim()}>
              <Send className="mr-1.5 h-4 w-4" /> Send typed message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FacultyCoordinatorReports() {
  const [data, setData] = useState<FacultyCoordinatorReportsData>({ awaitingAcceptance: [], readyForDepartment: [] });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [departmentCoordinators, setDepartmentCoordinators] = useState<Array<{ id: string; name: string }>>([]);
  const [forwardMessages, setForwardMessages] = useState<Record<string, string>>({});
  const [selectedCoordinators, setSelectedCoordinators] = useState<Record<string, string>>({});
  const { sendMessage, refresh: refreshConversations } = useMessages();

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reports, coordinators] = await Promise.all([
        fetchFacultyCoordinatorReportsData(),
        fetchAvailableDepartmentCoordinators(),
      ]);
      setData(reports);
      setDepartmentCoordinators(coordinators.map((coordinator) => ({ id: coordinator.id, name: coordinator.name })));
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load faculty reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const runAction = async (reportId: string, action: () => Promise<void>) => {
    setUpdatingId(reportId);
    setError(null);
    try {
      await action();
      await loadReports();
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to update the report.");
    } finally {
      setUpdatingId(null);
    }
  };

  const forwardTypedReport = async (report: FacultyCoordinatorReportRow) => {
    const coordinatorId = selectedCoordinators[report.id] || report.departmentCoordinatorId || "";
    const message = forwardMessages[report.id]?.trim();
    if (!coordinatorId) throw new Error("Select a department coordinator first.");
    if (!message) throw new Error("Type a report message before sending.");

    setUpdatingId(report.id);
    setError(null);
    try {
      const conversation = await startConversation(coordinatorId);
      await sendMessage(conversation.id, message);
      await refreshConversations();
      setForwardMessages((current) => ({ ...current, [report.id]: "" }));
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to forward the typed report.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading faculty reports...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Weekly Logbook Reports</h2>
          <p className="text-muted-foreground">Accept reports after organisation supervisor review, then send them to the department coordinator.</p>
        </div>
        <Button variant="outline" onClick={() => void loadReports()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Reports awaiting faculty acceptance</h3>
          <p className="text-sm text-muted-foreground">These reports have been approved by the organisation supervisor.</p>
        </div>
        {data.awaitingAcceptance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No supervisor-approved reports are waiting for acceptance.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.awaitingAcceptance.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                action={() => void runAction(report.id, () => acceptFacultyCoordinatorReport(report.id))}
                actionLabel={updatingId === report.id ? "Accepting..." : "Accept report"}
                actionIcon={CheckCircle2}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Send reports to department coordinator</h3>
          <p className="text-sm text-muted-foreground">Accepted reports ready to be forwarded for department-level review.</p>
        </div>
        {data.readyForDepartment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accepted reports are ready to send.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.readyForDepartment.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                action={() => void runAction(report.id, () => sendFacultyCoordinatorReportToDepartment(report.id))}
                actionLabel={updatingId === report.id ? "Sending..." : "Send to department"}
                actionIcon={Send}
                forwardMessage={forwardMessages[report.id]}
                departmentCoordinatorId={selectedCoordinators[report.id] || report.departmentCoordinatorId || ""}
                departmentCoordinators={departmentCoordinators}
                onCoordinatorChange={(value) => setSelectedCoordinators((current) => ({ ...current, [report.id]: value }))}
                onMessageChange={(value) => setForwardMessages((current) => ({ ...current, [report.id]: value }))}
                onForward={() => void forwardTypedReport(report)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
