import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchSupervisorInternships,
  fetchSupervisorStudents,
  fetchSupervisorLogbooks,
} from "@/services/supabase-api";
import { LOGBOOK_STATUS, SUPERVISOR_ACTIONABLE, logbookBadgeClass, LOGBOOK_STATUS_LABELS } from "@/lib/logbookStatus";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, NotebookPen, ArrowRight } from "lucide-react";

interface Report {
  id: string;
  status: string;
  createdAt?: string | null;
  weekNumber?: number | null;
  internship?: { id?: string; title?: string | null } | null;
  student?: { id?: string; name?: string | null; email?: string | null } | null;
}

export default function SupervisorOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internships, setInternships] = useState<unknown[]>([]);
  const [students, setStudents] = useState<unknown[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [internshipData, studentData, reportData] = await Promise.all([
          fetchSupervisorInternships(),
          fetchSupervisorStudents(),
          fetchSupervisorLogbooks(),
        ]);
        setInternships(internshipData);
        setStudents(studentData);
        setReports(reportData as Report[]);
      } catch (err) {
        setError("Failed to load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingReviews = reports.filter((r) => SUPERVISOR_ACTIONABLE.has(r.status)).length;

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Supervisor Overview</h2>
        <p className="text-muted-foreground">Monitor and review your supervised students’ internship logbooks.</p>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Assigned Internships" value={internships.length} icon={Briefcase} />
        <StatCard title="My Students" value={students.length} icon={Users} />
        <StatCard title="Pending Reviews" value={pendingReviews} icon={NotebookPen} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Assigned Internships</span>
              <Link to="/supervisor/students" className="text-sm text-primary inline-flex items-center gap-1">
                View students <ArrowRight className="h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {internships.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are not assigned to any internships yet.</p>
            ) : (
              (internships as { id: string; title: string; status?: string | null }[]).map((i) => (
                <div key={i.id} className="rounded-lg border p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{i.title}</span>
                  <Badge variant="outline">{i.status || "ACTIVE"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Reports Awaiting Your Review</span>
              <Link to="/supervisor/logbooks" className="text-sm text-primary inline-flex items-center gap-1">
                Review logbooks <ArrowRight className="h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews === 0 ? (
              <p className="text-sm text-muted-foreground">No reports are awaiting your review.</p>
            ) : (
              reports
                .filter((r) => SUPERVISOR_ACTIONABLE.has(r.status))
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.student?.name || r.student?.email || "Student"} · Week {r.weekNumber}</span>
                      <Badge variant="outline" className={logbookBadgeClass(r.status)}>{LOGBOOK_STATUS_LABELS[r.status] || r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.internship?.title}</p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
