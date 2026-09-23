import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { FileText, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { fetchStudentTasks, updateStudentTask, type SupervisorTask } from "@/services/supabase-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ApplicationItem {
  id: string;
  status: string;
  createdAt: string;
  internship?: {
    title?: string;
    company?: string;
    recruiter?: {
      company?: string | null;
    };
  };
}

export default function StudentOverview() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [tasks, setTasks] = useState<SupervisorTask[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
const token = localStorage.getItem("access_token");
        const res = await api.get<ApplicationItem[]>("/applications-list/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications((res.data || []).filter((item: ApplicationItem) => item && typeof item === "object"));
      } catch (error) {
        console.error("Failed to load student applications", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const loadTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const items = await fetchStudentTasks();
      setTasks(items);
      setTaskUpdates(Object.fromEntries(items.map((task) => [task.id, task.studentUpdate || ""])));
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : "Unable to load assigned tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => { void loadTasks(); }, []);

  const saveTaskUpdate = async (task: SupervisorTask) => {
    setSavingTaskId(task.id);
    try {
      const updated = await updateStudentTask(task.id, taskUpdates[task.id] || "");
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updated } : item));
      toast({ title: "Update sent", description: "Your company supervisor can now see your progress update." });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingTaskId(null);
    }
  };

  const stats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((app) => app.status?.toUpperCase() === "ACCEPTED").length;
    const pending = applications.filter((app) => ["PENDING", "REVIEWING"].includes(app.status?.toUpperCase())).length;
    const rejected = applications.filter((app) => app.status?.toUpperCase() === "REJECTED").length;

    return { total, accepted, pending, rejected };
  }, [applications]);

  const recentApps = useMemo(() => {
    return applications
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map((app) => ({
        role: app.internship?.title || "Untitled Internship",
        company: app.internship?.recruiter?.company || app.internship?.company || "Company",
        status: (app.status?.toLowerCase() || "pending") as "pending" | "accepted" | "rejected" | "reviewing",
        date: new Date(app.createdAt).toLocaleDateString(),
      }));
  }, [applications]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Overview</h2>
        <p className="text-muted-foreground">Track your internship applications at a glance.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.total} icon={FileText} trend={loading ? "Loading..." : `${stats.total > 0 ? "+" : ""}${stats.total} total`} />
        <StatCard title="Accepted" value={stats.accepted} icon={CheckCircle} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentApps.length > 0 ? recentApps.map((app, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{app.role}</p>
                  <p className="text-xs text-muted-foreground">{app.company} · {app.date}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            )) : <p className="text-sm text-muted-foreground">No applications yet.</p>}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-card border-primary/30">
        <CardHeader><CardTitle className="text-base flex items-center justify-between"><span>Assigned tasks</span><Button variant="ghost" size="sm" onClick={() => void loadTasks()} disabled={tasksLoading}><RefreshCw className={`mr-2 h-4 w-4 ${tasksLoading ? "animate-spin" : ""}`} />Refresh</Button></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {tasksLoading ? <p className="text-sm text-muted-foreground">Loading your assigned tasks...</p> : tasksError ? <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"><p>{tasksError}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => void loadTasks()}>Try again</Button></div> : tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks have been assigned to you yet.</p> : tasks.map((task) => (
            <div key={task.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">Due: {task.dueDate || "No due date"}</p></div>
                <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>{task.status === "COMPLETED" ? "Completed" : "Pending"}</Badge>
              </div>
              <Textarea rows={3} value={taskUpdates[task.id] || ""} onChange={(event) => setTaskUpdates((current) => ({ ...current, [task.id]: event.target.value }))} placeholder="Tell your company supervisor about your progress..." />
              <Button size="sm" onClick={() => void saveTaskUpdate(task)} disabled={savingTaskId === task.id}>{savingTaskId === task.id ? "Sending..." : "Send update to supervisor"}</Button>
              {task.studentUpdatedAt && <p className="text-xs text-muted-foreground">Last sent {new Date(task.studentUpdatedAt).toLocaleString()}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
