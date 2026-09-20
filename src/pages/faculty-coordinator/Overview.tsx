import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, BriefcaseBusiness, Users, ClipboardCheck, GraduationCap, TrendingUp, BellRing, FileText, MapPinned } from "lucide-react";

const stats = [
  { title: "Total students on internship", value: 324, icon: Users, description: "+18 this month" },
  { title: "Total departments", value: 12, icon: Building2, description: "Across 4 faculties" },
  { title: "Total organisations", value: 86, icon: BriefcaseBusiness, description: "22 new placements" },
  { title: "Total supervisors", value: 41, icon: GraduationCap, description: "8 pending onboarding" },
];

const internshipStats = [
  { label: "Active internship placements", value: "72%", change: "+5.4%", tone: "success" },
  { label: "Completed internships", value: "138", change: "+12", tone: "default" },
  { label: "Pending confirmations", value: "19", change: "-7 since last week", tone: "warning" },
  { label: "Average placement satisfaction", value: "4.7/5", change: "+0.2", tone: "success" },
];

const departmentOverview = [
  { name: "Computer Science", students: 86, placements: 24, completion: 78 },
  { name: "Business Administration", students: 71, placements: 18, completion: 69 },
  { name: "Engineering", students: 64, placements: 17, completion: 73 },
  { name: "Communications", students: 39, placements: 11, completion: 65 },
];

const pendingActions = [
  { title: "Supervisor onboarding approvals", count: 8, detail: "Awaiting confirmation for new supervisors" },
  { title: "Organisation verification requests", count: 5, detail: "Needs review before student placements" },
  { title: "Report submissions due", count: 14, detail: "Students yet to submit weekly reports" },
  { title: "Placement agreement renewals", count: 3, detail: "Expiring in the next 10 days" },
];

const internshipReports = [
  { student: "Maya Patel", department: "Computer Science", organisation: "Nexa Labs", status: "Approved", date: "12 Aug 2026" },
  { student: "Daniel Okafor", department: "Engineering", organisation: "Atlas Grid", status: "Review", date: "10 Aug 2026" },
  { student: "Aisha Bello", department: "Business Administration", organisation: "BluePeak", status: "Pending", date: "08 Aug 2026" },
];

const coordinatorManagement = [
  { name: "Dr. Mercy James", role: "Faculty Coordinator", status: "Active", lastActive: "Today, 09:14" },
  { name: "Mr. Daniel Smith", role: "Department Coordinator", status: "On leave", lastActive: "Yesterday" },
  { name: "Prof. Grace Nwosu", role: "Program Lead", status: "Active", lastActive: "2 hours ago" },
];

export default function FacultyCoordinatorOverview() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Faculty Coordinator Overview</h2>
          <p className="text-muted-foreground">Monitor internship performance, departments, and outstanding coordination tasks.</p>
        </div>
        <Button className="w-fit">Generate report</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} description={stat.description} />
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
            {internshipStats.map((item) => (
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
            {pendingActions.map((action) => (
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
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentOverview.map((department) => (
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
                Internship reports
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                Open reports
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {internshipReports.map((report) => (
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
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{report.date}</span>
                  <button className="inline-flex items-center gap-1 text-primary">
                    View <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Coordinator management
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              Manage team
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {coordinatorManagement.map((person) => (
              <div key={person.name} className="rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium text-sm">
                    {person.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <Badge variant={person.status === "Active" ? "default" : "secondary"}>{person.status}</Badge>
                  <span className="text-muted-foreground">{person.lastActive}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
