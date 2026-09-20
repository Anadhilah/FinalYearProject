import { Link } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, CalendarRange, TrendingUp, MessageSquareText, CheckCircle2, XCircle, ClipboardList, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: number;
  title: string;
  dueDate: string;
  status: "Pending" | "Completed";
}

interface WeeklyReportEntry {
  id: number;
  title: string;
  summary: string;
}

const student = {
  id: "1",
  name: "Maya Patel",
  email: "maya.patel@internconnect.edu",
  internship: "Frontend Developer Intern",
  company: "Nexa Labs",
  startDate: "Aug 01, 2026",
  endDate: "Oct 31, 2026",
  department: "Computer Science",
  manager: "Dr. Adebayo",
  currentStatus: "On Track",
};

const weeklyReportEntries: WeeklyReportEntry[] = [
  {
    id: 2,
    title: "Validated the weekly design checklist",
    summary: "Completed and included in the weekly report automatically after approval of the task.",
  },
];

const completedTasks = 2;
const totalTasks = 3;
const progress = Math.round((completedTasks / totalTasks) * 100);

const submissions = [
  {
    id: 1,
    week: "Week 5",
    title: "Frontend improvements and testing",
    summary: "Completed the dashboard widgets, improved mobile spacing, and documented the testing checklist.",
    status: "Pending review",
    hours: 22,
  },
  {
    id: 2,
    week: "Week 4",
    title: "API integration work",
    summary: "Implemented API calls for student statistics and updated the UI states for loading and errors.",
    status: "Approved",
    hours: 18,
  },
];

export default function StudentDetails() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/supervisor/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">{student.name}</h2>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
        <Badge variant="default">{student.currentStatus}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Internship</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-display font-bold">{student.internship}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Company</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-display font-bold">{student.company}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-display font-bold">{progress}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-display font-bold">Aug 15</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              Internship information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-muted-foreground">Department</p>
                <p className="mt-1 font-medium">{student.department}</p>
              </div>
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-muted-foreground">Assigned supervisor</p>
                <p className="mt-1 font-medium">{student.manager}</p>
              </div>
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-muted-foreground">Start date</p>
                <p className="mt-1 font-medium">{student.startDate}</p>
              </div>
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-muted-foreground">End date</p>
                <p className="mt-1 font-medium">{student.endDate}</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Task completion</p>
              <p className="mt-1 text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Task management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/30 p-4">
              <p className="text-sm font-medium">Weekly task assignment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create and manage new tasks for this intern from a dedicated page.
              </p>
            </div>

            <Link to={`/supervisor/students/${student.id}/tasks`}>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Assign new task
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Weekly report preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 bg-muted/20">
            <p className="text-sm font-medium">Week 5 report summary</p>
            <p className="mt-1 text-xs text-muted-foreground">Completed tasks are automatically included here as they are marked complete.</p>
          </div>

          {weeklyReportEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4">
              <p className="font-medium">{entry.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>
            </div>
          ))}

          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{submission.week} · {submission.title}</p>
                    <p className="text-xs text-muted-foreground">{submission.hours} hours recorded</p>
                  </div>
                  <Badge variant={submission.status === "Approved" ? "default" : "secondary"}>{submission.status}</Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{submission.summary}</p>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Supervisor feedback</label>
                  <Textarea rows={3} defaultValue={submission.status === "Approved" ? "Good progress this week. Keep up the consistency." : "Please add a clearer summary of the testing results and next steps."} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="default">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
