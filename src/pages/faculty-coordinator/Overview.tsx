import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ClipboardCheck, TrendingUp, BellRing, RefreshCw, BriefcaseBusiness, UserRound, FileText, AlertTriangle } from "lucide-react";
import { FacultyCoordinatorOverviewData, fetchFacultyCoordinatorOverviewData } from "@/services/supabase-api";

export default function FacultyCoordinatorOverview() {
  const [data, setData] = useState<FacultyCoordinatorOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchFacultyCoordinatorOverviewData());
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load the faculty overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading faculty overview...</div>;
  if (!data) return <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || "Unable to load the faculty overview."}</div>;

  const statIcons = [Users, BriefcaseBusiness, UserRound, ClipboardCheck, FileText, AlertTriangle];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Faculty Coordinator Overview</h2>
          <p className="text-muted-foreground">Monitor internship performance, departments, and outstanding coordination tasks.</p>
        </div>
        <Button className="w-fit" variant="outline" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.stats.map((stat, index) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={statIcons[index]} description={stat.description} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Internship statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {data.internshipStats.map((item) => (
              <div key={item.label} className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-2xl font-display font-bold">{item.value}</span>
                  <span
                    className={
                      item.tone === "success"
                        ? "text-success text-xs font-medium"
                        : item.tone === "warning"
                          ? "text-amber-600 text-xs font-medium"
                          : "text-muted-foreground text-xs"
                    }
                  >
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Pending coordinator actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingActions.map((action) => (
              <div key={action.title} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{action.title}</span>
                  <Badge variant="secondary">{action.count}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{action.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department overview
              </span>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Link to="/faculty-coordinator/departments">
                View all
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.departmentOverview.map((department) => (
              <div key={department.name} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{department.name}</span>
                  <Badge variant="outline">{department.placements} placements</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground">
                  <div>
                    <p>Students</p>
                    <p className="font-medium text-foreground">{department.students}</p>
                  </div>
                  <div>
                    <p>Completion</p>
                    <p className="font-medium text-foreground">{department.completion}%</p>
                  </div>
                  <div>
                    <p>Progress</p>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${department.completion}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Recent placement activity
              </span>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Link to="/faculty-coordinator/reports">
                Open summaries
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.internshipReports.map((report) => (
              <div key={`${report.student}-${report.date}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{report.student}</p>
                    <p className="text-xs text-muted-foreground">{report.department} · {report.organisation}</p>
                  </div>
                  <Badge
                    variant={
                      report.status === "Approved"
                        ? "default"
                        : report.status === "Review"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">{report.date}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
