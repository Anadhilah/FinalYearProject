import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSupervisorStudents, fetchSupervisorTasks, type SupervisorTask } from "@/services/supabase-api";

export default function SupervisorOverview() {
  const [students, setStudents] = useState<Array<{ student: { id: string; name?: string | null }; internships: Array<{ title: string }> }>>([]);
  const [tasks, setTasks] = useState<SupervisorTask[]>([]);

  useEffect(() => {
    fetchSupervisorStudents().then(async (studentRows) => {
      setStudents(studentRows);
      const taskRows = await Promise.all(studentRows.map((row) => fetchSupervisorTasks(row.student.id)));
      setTasks(taskRows.flat());
    });
  }, []);

  const openTasks = tasks.filter((task) => task.status !== "COMPLETED");
  const studentUpdates = tasks.filter((task) => task.studentUpdate);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Company Supervisor Overview</h2>
        <p className="text-muted-foreground">Track assigned interns, review submitted work, and manage weekly tasks for your company placements.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students under supervision" value={students.length} icon={Users} description="Assigned to your internships" />
        <StatCard title="Active internships" value={new Set(students.flatMap((row) => row.internships.map((internship) => internship.title))).size} icon={BriefcaseBusiness} description="With assigned students" />
        <StatCard title="Open tasks" value={openTasks.length} icon={ClipboardList} description="Across assigned students" />
        <StatCard title="Student updates" value={studentUpdates.length} icon={CheckCircle2} description="Updates ready to review" />
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
            {students.slice(0, 4).map((row) => (
              (() => { const student = { name: row.student.name || "Student", company: "Assigned company", role: row.internships[0]?.title || "Internship", progress: 0, status: "Assigned" }; return (
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
              </div>); })()
            ))}
            {students.length === 0 && <p className="text-sm text-muted-foreground">No students are assigned yet.</p>}
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
            <p className="text-sm text-muted-foreground">Task tracking is not configured yet.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4" />
              Recent task updates
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              Review all
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {studentUpdates.slice(0, 6).map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.studentUpdate}</p>
              </div>
              <Badge variant="secondary">Student update</Badge>
            </div>
          ))}
          {studentUpdates.length === 0 && <p className="text-sm text-muted-foreground">No student updates yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
