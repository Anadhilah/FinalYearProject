import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, CalendarRange, CheckCircle2, ClipboardList, Plus, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LOGBOOK_STATUS_LABELS, SUPERVISOR_ACTIONABLE } from "@/lib/logbookStatus";
import {
  fetchSupervisorLogbooks,
  fetchSupervisorStudents,
  fetchSupervisorTasks,
  reviewLogbookAsSupervisor,
  type LogbookReport,
  type SupervisorTask,
} from "@/services/supabase-api";

type SupervisorStudentAssignment = Awaited<ReturnType<typeof fetchSupervisorStudents>>[number];

function formatDate(value?: string | null): string {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatStatus(value?: string | null): string {
  if (!value) return "Status unavailable";
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StudentDetails() {
  const { studentId = "" } = useParams();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<SupervisorStudentAssignment | null>(null);
  const [tasks, setTasks] = useState<SupervisorTask[]>([]);
  const [reports, setReports] = useState<LogbookReport[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [students, studentTasks, supervisorReports] = await Promise.all([
        fetchSupervisorStudents(),
        fetchSupervisorTasks(studentId),
        fetchSupervisorLogbooks(),
      ]);
      const studentAssignment = students.find((item) => item.student.id === studentId) || null;
      setAssignment(studentAssignment);
      setTasks(studentAssignment ? studentTasks : []);
      const studentReports = studentAssignment
        ? supervisorReports.filter((report) => report.studentId === studentId)
        : [];
      setReports(studentReports);
      setFeedback(Object.fromEntries(studentReports.map((report) => [report.id, report.supervisorComment || ""])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load student details.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { void loadStudent(); }, [loadStudent]);

  useEffect(() => {
    if (!loading && window.location.hash === "#reports") {
      document.getElementById("reports")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, assignment]);

  const reviewReport = async (report: LogbookReport, decision: "APPROVED" | "NEEDS_REVISION") => {
    setReviewingId(report.id);
    setError(null);
    try {
      const comment = feedback[report.id]?.trim() || "";
      await reviewLogbookAsSupervisor(report.id, decision, comment);
      const status = decision === "APPROVED" ? "SUPERVISOR_APPROVED" : "SUPERVISOR_CHANGES_REQUESTED";
      setReports((current) => current.map((item) => item.id === report.id
        ? { ...item, status, supervisorComment: comment || null }
        : item));
      toast({ title: decision === "APPROVED" ? "Report approved" : "Changes requested" });
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to save report review.");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading student details...</p>;

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Link to="/supervisor/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error || "This student is not assigned to you."}</p>
      </div>
    );
  }

  const student = assignment.student;
  const internship = assignment.internships[0];
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/supervisor/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
        <Button variant="outline" size="sm" onClick={() => void loadStudent()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">{student.name || "Student"}</h2>
          <p className="text-muted-foreground">{student.email || "Email not provided"}</p>
        </div>
        <Badge variant="outline">{formatStatus(internship?.status)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Internship</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-display font-bold">{internship?.title || "Not assigned"}</p></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Company</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-display font-bold">{internship?.company || "Not provided"}</p></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Task progress</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-display font-bold">{progress}%</p></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed tasks</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-display font-bold">{completedTasks} of {tasks.length}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BriefcaseBusiness className="h-4 w-4" /> Internship information</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">Department</p><p className="mt-1 font-medium">{student.major || "Not provided"}</p></div>
            <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">University</p><p className="mt-1 font-medium">{student.university || "Not provided"}</p></div>
            <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">Start date</p><p className="mt-1 font-medium">{formatDate(internship?.startDate)}</p></div>
            <div className="rounded-md bg-muted/30 p-3"><p className="text-muted-foreground">End date</p><p className="mt-1 font-medium">{formatDate(internship?.endDate)}</p></div>
            {assignment.internships.length > 1 && (
              <div className="rounded-md bg-muted/30 p-3 sm:col-span-2">
                <p className="text-muted-foreground">Other assigned internships</p>
                <p className="mt-1 font-medium">{assignment.internships.slice(1).map((item) => item.title).join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" /> Assigned tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks assigned yet.</p> : tasks.map((task) => (
              <div key={task.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{task.title}</p>
                  <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>{formatStatus(task.status)}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarRange className="h-3.5 w-3.5" /> Due {formatDate(task.dueDate)}</p>
                {task.studentUpdate && <p className="mt-2 rounded bg-muted/40 p-2 text-sm">{task.studentUpdate}</p>}
              </div>
            ))}
            <Button asChild className="w-full">
              <Link to={`/supervisor/students/${student.id}/tasks`}><Plus className="mr-2 h-4 w-4" /> Manage tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card id="reports" className="shadow-card scroll-mt-6">
        <CardHeader><CardTitle className="text-base">Weekly reports</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 ? <p className="text-sm text-muted-foreground">No weekly reports submitted yet.</p> : reports.map((report) => {
            const canReview = SUPERVISOR_ACTIONABLE.has(report.status || "");
            return (
              <article key={report.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">Week {report.weekNumber ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.startDate)} – {formatDate(report.endDate)} · {report.hoursWorked ?? 0} hours</p>
                  </div>
                  <Badge variant={report.status === "SUPERVISOR_APPROVED" || report.status === "APPROVED" ? "default" : "secondary"}>
                    {LOGBOOK_STATUS_LABELS[report.status || ""] || formatStatus(report.status)}
                  </Badge>
                </div>
                {report.tasksPerformed && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">Tasks performed</p><p className="mt-1 whitespace-pre-wrap text-sm">{report.tasksPerformed}</p></div>}
                {report.skillsLearned && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">Skills learned</p><p className="mt-1 whitespace-pre-wrap text-sm">{report.skillsLearned}</p></div>}
                {report.challengesFaced && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">Challenges</p><p className="mt-1 whitespace-pre-wrap text-sm">{report.challengesFaced}</p></div>}
                {report.supervisorComment && <p className="mt-3 rounded-md bg-muted/40 p-2 text-sm"><span className="font-medium">Your feedback:</span> {report.supervisorComment}</p>}
                {canReview && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <Textarea
                      rows={3}
                      value={feedback[report.id] || ""}
                      onChange={(event) => setFeedback((current) => ({ ...current, [report.id]: event.target.value }))}
                      placeholder="Optional feedback for this report"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void reviewReport(report, "APPROVED")} disabled={reviewingId === report.id}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewReport(report, "NEEDS_REVISION")} disabled={reviewingId === report.id || !feedback[report.id]?.trim()}>
                        <XCircle className="mr-2 h-4 w-4" /> Request changes
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
