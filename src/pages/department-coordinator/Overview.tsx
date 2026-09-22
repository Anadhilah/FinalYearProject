import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, ClipboardCheck, AlertTriangle, CalendarClock, FileText, ArrowRight, UserRound, RefreshCw } from "lucide-react";
import { fetchDepartmentCoordinatorOverviewData, DepartmentCoordinatorOverviewData } from "@/services/supabase-api";

export default function DepartmentCoordinatorOverview() {
  const [data, setData] = useState<DepartmentCoordinatorOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDepartmentCoordinatorOverviewData());
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load the department overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading department overview...</div>;
  if (!data) return <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || "Unable to load the department overview."}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Department Coordinator Overview</h2>
          <p className="text-muted-foreground">Track student placement progress, supervisor feedback, and department-level internship health.</p>
        </div>
        <Button className="w-fit" variant="outline" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat, index) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={[Users, ClipboardCheck, Building2, AlertTriangle][index]} description={stat.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students in department
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Student</th>
                  <th className="pb-2 pr-4 font-medium">Internship</th>
                  <th className="pb-2 pr-4 font-medium">Supervisor</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Ends</th>
                </tr>
              </thead>
              <tbody>
                {data.studentPlacements.map((student) => (
                  <tr key={student.student} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{student.student}</td>
                    <td className="py-3 pr-4">{student.company}</td>
                    <td className="py-3 pr-4">{student.supervisor}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          student.status === "On Track"
                            ? "default"
                            : student.status === "At Risk"
                              ? "secondary"
                              : student.status === "Needs Review"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="py-3">{student.endDate}</td>
                  </tr>
                ))}
                {data.studentPlacements.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No student placement records found.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Students whose internship is ending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.endingSoon.map((student) => (
              <div key={student.student} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{student.student}</span>
                  <Badge variant="outline">{student.daysLeft} days</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{student.company}</p>
              </div>
            ))}
            {data.endingSoon.length === 0 && <p className="text-sm text-muted-foreground">No internships are ending in the next 30 days.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports from supervisors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.supervisorReports.map((report) => (
              <div key={`${report.supervisor}-${report.date}`} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{report.supervisor}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{report.topic}</p>
                  </div>
                  <button className="inline-flex items-center gap-1 text-primary text-xs">
                    Review <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{report.date}</p>
              </div>
            ))}
            {data.supervisorReports.length === 0 && <p className="text-sm text-muted-foreground">No recent supervisor activity found.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><UserRound className="h-4 w-4" /> Faculty coordinators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.facultyCoordinators.map((coordinator) => (
              <div key={coordinator.name} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div><p className="text-sm font-medium">{coordinator.name}</p><p className="text-xs text-muted-foreground">Supporting {coordinator.students} students</p></div>
                <Badge>{coordinator.status}</Badge>
              </div>
            ))}
            {data.facultyCoordinators.length === 0 && <p className="text-sm text-muted-foreground">No active faculty coordinators are assigned to this department.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organisations hosting students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.organisations.map((organisation) => (
              <div key={organisation.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{organisation.name}</span>
                  <Badge variant="secondary">{organisation.students} students</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{organisation.sectors}</p>
              </div>
            ))}
            {data.organisations.length === 0 && <p className="text-sm text-muted-foreground">No hosting organisations found.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
