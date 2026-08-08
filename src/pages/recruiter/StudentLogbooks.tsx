import { useEffect, useState } from "react";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ReviewItem {
  id: string;
  student: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null };
  internship: { id: string; title: string };
  weekNumber: number;
  startDate: string;
  endDate: string;
  tasksPerformed: string;
  skillsLearned: string;
  challengesFaced: string;
  hoursWorked: number;
  attachmentUrls?: string | null;
  status: string;
  recruiterComment?: string | null;
  createdAt: string;
}

interface ExportPayload {
  internship: { id: string; title: string; [key: string]: unknown };
  reports: unknown[];
}

export default function StudentLogbooks() {
  const [reports, setReports] = useState<ReviewItem[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReports = async () => {
    const token = localStorage.getItem("access_token");
const res = await api.get<ReviewItem[]>("/logbooks/recruiter", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReports((res.data || []).map((item) => ({ ...item })));
  };

  useEffect(() => {
    loadReports().catch(() => setMessage("Unable to load reports"));
  }, []);

  const reviewReport = async (reportId: string, status: string) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      await api.post(
        `/logbooks/${reportId}/comment`,
        { status, recruiterComment: comments[reportId] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Report ${status.toLowerCase().replace(/_/g, " ")} successfully.`);
      await loadReports();
    } catch {
      setMessage("Unable to review report.");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async (internshipId: string) => {
    const token = localStorage.getItem("access_token");
const res = await api.get<ExportPayload>(`/logbooks/export/${internshipId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = res.data;
    if (payload) {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${payload.internship.title || "internship"}-logbook.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF export payload prepared. Use your preferred PDF tool to generate the final document.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Student Logbooks</h2>
        <p className="text-muted-foreground">Review weekly reports, leave feedback, approve them, or request revisions.</p>
      </div>
      {message && <div className="rounded-lg border border-border bg-card p-3 text-sm">{message}</div>}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">{report.student.name || report.student.email} · Week {report.weekNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{report.internship.title} · {report.startDate} to {report.endDate}</p>
                <Badge variant="outline" className={report.status === "APPROVED" ? "bg-success/10 text-success border-success/20" : report.status === "NEEDS_REVISION" ? "bg-warning/10 text-warning border-warning/20" : "bg-primary/10 text-primary border-primary/20"}>{report.status}</Badge>
              </div>
              <div className="text-sm space-y-2">
                <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
                <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
                <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
                <p><span className="font-medium">Hours:</span> {report.hoursWorked}</p>
              </div>
              <Textarea value={comments[report.id] || report.recruiterComment || ""} onChange={(e) => setComments({ ...comments, [report.id]: e.target.value })} placeholder="Leave recruiter feedback" rows={3} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reviewReport(report.id, "APPROVED")} disabled={loading}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reviewReport(report.id, "NEEDS_REVISION")} disabled={loading}>Request Revision</Button>
                <Button size="sm" variant="secondary" onClick={() => exportPdf(report.internship.id)} disabled={loading}>Export Internship PDF Data</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!reports.length && <p className="text-sm text-muted-foreground">No submitted reports yet.</p>}
      </div>
    </div>
  );
}