import { useEffect, useState } from "react";
import { fetchSupervisorLogbooks } from "@/services/supabase-api";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LOGBOOK_STATUS_LABELS, logbookBadgeClass } from "@/lib/logbookStatus";

interface ReviewItem {
  id: string;
  student?: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null } | null;
  internship?: { id: string; title?: string | null } | null;
  weekNumber?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  tasksPerformed?: string | null;
  skillsLearned?: string | null;
  challengesFaced?: string | null;
  hoursWorked?: number | null;
  attachmentUrls?: string | null;
  status: string;
  recruiterComment?: string | null;
  supervisorComment?: string | null;
  createdAt?: string | null;
}

export default function SupervisorLogbooks() {
  const [reports, setReports] = useState<ReviewItem[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReports = async () => {
    const data = await fetchSupervisorLogbooks();
    setReports(data as ReviewItem[]);
  };

  useEffect(() => {
    loadReports().catch(() => setMessage("Unable to load reports"));
  }, []);

  const reviewReport = async (reportId: string, status: string) => {
    setLoading(true);
    try {
      const comment = comments[reportId] || "";
      await api.post(
        `/logbooks/${reportId}/supervisor-comment`,
        { status, comment },
        {}
      );
      setMessage(`Report ${status.toLowerCase().replace(/_/g, " ")} successfully.`);
      setComments((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      await loadReports();
    } catch {
      setMessage("Unable to review report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Logbook Reviews</h2>
        <p className="text-muted-foreground">Review weekly reports from your supervised students.</p>
      </div>
      {message && <div className="rounded-lg border border-border bg-card p-3 text-sm">{message}</div>}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">{report.student?.name || report.student?.email || "Student"} · Week {report.weekNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {report.internship?.title || "Internship"} · {report.startDate || "—"} to {report.endDate || "—"}
                </p>
                <Badge variant="outline" className={logbookBadgeClass(report.status)}>
                  {LOGBOOK_STATUS_LABELS[report.status] || report.status}
                </Badge>
              </div>
              <div className="text-sm space-y-2">
                <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
                <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
                <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
                <p><span className="font-medium">Hours:</span> {report.hoursWorked ?? 0}</p>
              </div>
              {report.recruiterComment && (
                <p className="text-sm rounded-lg bg-muted/50 p-2">
                  <span className="font-medium">Recruiter comment:</span> {report.recruiterComment}
                </p>
              )}
              <Textarea
                value={comments[report.id] ?? report.supervisorComment ?? ""}
                onChange={(e) => setComments({ ...comments, [report.id]: e.target.value })}
                placeholder="Leave supervisor feedback"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reviewReport(report.id, "APPROVED")} disabled={loading}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => reviewReport(report.id, "NEEDS_REVISION")} disabled={loading}>
                  Request Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!reports.length && <p className="text-sm text-muted-foreground">No reports available yet.</p>}
      </div>
    </div>
  );
}
