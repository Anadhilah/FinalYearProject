import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSupervisorLogbooks } from "@/services/supabase-api";
import api from "@/api/api";
import { ArrowLeft } from "lucide-react";
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
  status: string;
  recruiterComment?: string | null;
  supervisorComment?: string | null;
}

export default function StudentDetails() {
  const { studentId } = useParams();
  const [reports, setReports] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});

  const load = async () => {
    const data = (await fetchSupervisorLogbooks()) as ReviewItem[];
    setReports(studentId ? data.filter((r) => r.student?.id === studentId) : data);
  };

  useEffect(() => {
    load()
      .catch(() => setMessage("Unable to load reports"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const reviewReport = async (reportId: string, status: string) => {
    setBusy(true);
    try {
      await api.post(`/logbooks/${reportId}/supervisor-comment`, { status, comment: comments[reportId] || "" }, {});
      setMessage("Report updated.");
      setComments({});
      await load();
    } catch {
      setMessage("Unable to review report.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading student reports…</p>;

  const student = reports[0]?.student;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/supervisor/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>
      <div>
        <h2 className="text-2xl font-display font-bold">{student?.name || "Student"}</h2>
        <p className="text-muted-foreground">{student?.email}</p>
        {(student?.university || student?.major) && (
          <p className="text-sm text-muted-foreground mt-1">{[student?.university, student?.major].filter(Boolean).join(" · ")}</p>
        )}
      </div>

      {message && <div className="rounded-lg border border-border bg-card p-3 text-sm">{message}</div>}

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{report.internship?.title || "Internship"} · Week {report.weekNumber}</span>
                <Badge variant="outline" className={logbookBadgeClass(report.status)}>
                  {LOGBOOK_STATUS_LABELS[report.status] || report.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{report.startDate || "—"} to {report.endDate || "—"}</p>
              <div className="text-sm space-y-2">
                <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
                <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
                <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
                <p><span className="font-medium">Hours:</span> {report.hoursWorked ?? 0}</p>
              </div>
              {report.recruiterComment && (
                <p className="text-sm rounded-lg bg-muted/50 p-2"><span className="font-medium">Recruiter comment:</span> {report.recruiterComment}</p>
              )}
              <Textarea
                value={comments[report.id] ?? report.supervisorComment ?? ""}
                onChange={(e) => setComments({ ...comments, [report.id]: e.target.value })}
                placeholder="Supervisor feedback"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reviewReport(report.id, "APPROVED")} disabled={busy}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reviewReport(report.id, "NEEDS_REVISION")} disabled={busy}>Request Changes</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!reports.length && <p className="text-sm text-muted-foreground">No reports for this student yet.</p>}
      </div>
    </div>
  );
}
