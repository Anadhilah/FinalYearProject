import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BriefcaseBusiness,
  NotebookPen,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

const studentProgress = [
  { name: "Maya Patel", company: "Nexa Labs", role: "Frontend Intern", progress: 76, status: "On Track" },
  { name: "Daniel Okafor", company: "Atlas Grid", role: "Systems Intern", progress: 58, status: "Needs Review" },
  { name: "Aisha Bello", company: "BluePeak", role: "Marketing Intern", progress: 64, status: "On Track" },
  { name: "Joseph Mensah", company: "Harbor Logistics", role: "Operations Intern", progress: 42, status: "At Risk" },
];

const weeklyTasks = [
  { task: "Review frontend implementation of dashboard widgets", due: "Today" },
  { task: "Check weekly logbook submission for Daniel", due: "Tomorrow" },
  { task: "Approve Aisha’s internship presentation draft", due: "Thursday" },
];

const pendingReviews = [
  { student: "Maya Patel", report: "Week 5 report", status: "Pending" },
  { student: "Daniel Okafor", report: "Week 4 report", status: "Needs revision" },
  { student: "Joseph Mensah", report: "Week 3 report", status: "Pending" },
];

export default function SupervisorOverview() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Company Supervisor Overview</h2>
        <p className="text-muted-foreground">Track assigned interns, review submitted work, and manage weekly tasks for your company placements.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students under supervision" value={18} icon={Users} description="Across 7 active internships" />
        <StatCard title="Active internships" value={7} icon={BriefcaseBusiness} description="2 new placements this month" />
        <StatCard title="Weekly tasks due" value={5} icon={ClipboardList} description="3 need action today" />
        <StatCard title="Reports pending review" value={12} icon={NotebookPen} description="4 require supervisor feedback" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Student progress overview
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentProgress.map((student) => (
              <div key={student.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.company} · {student.role}</p>
                  </div>
                  <Badge
                    variant={
                      student.status === "On Track"
                        ? "default"
                        : student.status === "Needs Review"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${student.progress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{student.progress}% complete</span>
                  <button className="inline-flex items-center gap-1 text-primary">
                    Open profile <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Weekly tasks
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                Add task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyTasks.map((task) => (
              <div key={task.task} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{task.task}</span>
                  <Badge variant="outline">{task.due}</Badge>
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
              <FileCheck2 className="h-4 w-4" />
              Reports awaiting review
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              Review all
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingReviews.map((item) => (
            <div key={`${item.student}-${item.report}`} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{item.student}</p>
                <p className="text-xs text-muted-foreground">{item.report}</p>
              </div>
              <Badge
                variant={
                  item.status === "Pending" ? "secondary" : "outline"
                }
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
