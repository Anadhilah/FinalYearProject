import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Plus, CheckCircle2 } from "lucide-react";
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

const initialTasks: Task[] = [
  { id: 1, title: "Review the updated dashboard component for responsive behaviour.", dueDate: "Today", status: "Pending" },
  { id: 2, title: "Validate the UI against the weekly design checklist.", dueDate: "Tomorrow", status: "Completed" },
  { id: 3, title: "Submit progress notes with screenshots from the current sprint.", dueDate: "Thursday", status: "Pending" },
];

const initialReportEntries: WeeklyReportEntry[] = [
  {
    id: 2,
    title: "Validated the weekly design checklist",
    summary: "Completed and included in the weekly report automatically after approval of the task.",
  },
];

export default function AssignTasks() {
  const { studentId } = useParams();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [weeklyReportEntries, setWeeklyReportEntries] = useState<WeeklyReportEntry[]>(initialReportEntries);

  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = Math.round((completedTasks / tasks.length) * 100);

  const assignTask = () => {
    if (!newTask.trim()) return;

    const newTaskItem: Task = {
      id: Date.now(),
      title: newTask.trim(),
      dueDate: "New task",
      status: "Pending",
    };

    setTasks((prev) => [newTaskItem, ...prev]);
    setNewTask("");
  };

  const completeTask = (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === "Completed") return;

    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, status: "Completed" } : item
      )
    );

    setWeeklyReportEntries((prev) => {
      const alreadyAdded = prev.some((entry) => entry.id === taskId);
      if (alreadyAdded) return prev;

      return [
        {
          id: taskId,
          title: task.title,
          summary: `${task.title} was completed and automatically added to this week’s report.`,
        },
        ...prev,
      ];
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to={`/supervisor/students/${studentId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to student details
      </Link>

      <div>
        <h2 className="text-2xl font-display font-bold">Assign new tasks</h2>
        <p className="text-muted-foreground">Create weekly tasks for intern {studentId} and track when they are completed.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Weekly task list
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                    <Badge variant={task.status === "Completed" ? "default" : "secondary"}>{task.status}</Badge>
                  </div>

                  {task.status === "Pending" ? (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => completeTask(task.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark complete
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs text-success">Added to the weekly report</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/30 p-4">
              <p className="text-sm font-medium">Progress</p>
              <p className="mt-1 text-sm text-muted-foreground">{completedTasks} of {tasks.length} tasks completed</p>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New task</label>
              <Textarea
                rows={4}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new weekly task for this intern..."
              />
              <Button className="w-full" onClick={assignTask}>
                <Plus className="h-4 w-4 mr-2" />
                Assign task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Weekly report preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyReportEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4">
              <p className="font-medium">{entry.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
