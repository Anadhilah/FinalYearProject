import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, Flag, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { completeStudentTask, fetchStudentTasks, updateStudentTask, type SupervisorTask } from "@/services/supabase-api";

export default function StudentTasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<SupervisorTask[]>([]);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchStudentTasks();
      setTasks(items);
      setUpdates(Object.fromEntries(items.map((task) => [task.id, task.studentUpdate || ""])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTasks(); }, []);

  const saveUpdate = async (task: SupervisorTask) => {
    setSavingId(task.id);
    try {
      const updated = await updateStudentTask(task.id, updates[task.id] || "");
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updated } : item));
      toast({ title: "Update sent", description: "Your company supervisor can now see your progress." });
    } catch (saveError) {
      toast({ title: "Update failed", description: saveError instanceof Error ? saveError.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const completeTask = async (task: SupervisorTask) => {
    setSavingId(task.id);
    try {
      const updated = await completeStudentTask(task.id);
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updated } : item));
      toast({ title: "Task completed", description: "Your supervisor can see that you completed this task." });
    } catch (saveError) {
      toast({ title: "Could not complete task", description: saveError instanceof Error ? saveError.message : "Please try again.", variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const visibleTasks = tasks.filter((task) => filter === "ALL" || task.status === filter);
  const groupedTasks = visibleTasks.reduce<Record<string, { title: string; company: string; tasks: SupervisorTask[] }>>((groups, task) => {
    const key = task.internshipId;
    const current = groups[key] || {
      title: task.internship?.title || "Internship",
      company: task.internship?.recruiter?.company || "Company not provided",
      tasks: [],
    };
    current.tasks.push(task);
    groups[key] = current;
    return groups;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your task inbox</p>
          <h2 className="text-2xl font-display font-bold">My Tasks</h2>
          <p className="text-muted-foreground">View tasks assigned by your company supervisor and send progress updates.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadTasks()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />Assigned tasks</CardTitle><div className="flex gap-1"><Button size="sm" variant={filter === "ALL" ? "secondary" : "ghost"} onClick={() => setFilter("ALL")}>All</Button><Button size="sm" variant={filter === "PENDING" ? "secondary" : "ghost"} onClick={() => setFilter("PENDING")}>Open</Button><Button size="sm" variant={filter === "COMPLETED" ? "secondary" : "ghost"} onClick={() => setFilter("COMPLETED")}>Done</Button></div></CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading your assigned tasks...</p> : error ? <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive"><p>{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void loadTasks()}>Try again</Button></div> : visibleTasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks in this view.</p> : Object.entries(groupedTasks).map(([internshipId, group]) => (
            <section key={internshipId} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div><h3 className="font-semibold">{group.title}</h3><p className="text-xs text-muted-foreground">{group.company}</p></div>
                <Badge variant="outline">{group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}</Badge>
              </div>
              {group.tasks.map((task) => (
            <div key={task.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-medium">{task.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{task.dueDate || "No due date"} <span className="mx-1">·</span><Flag className={`h-3 w-3 ${task.priority === "URGENT" ? "text-destructive" : "text-primary"}`} />{task.priority || "NORMAL"}</p></div>
                <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>{task.status === "COMPLETED" ? "Completed" : "Pending"}</Badge>
              </div>
              <Textarea rows={3} value={updates[task.id] || ""} onChange={(event) => setUpdates((current) => ({ ...current, [task.id]: event.target.value }))} placeholder="Tell your company supervisor about your progress..." />
              <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void saveUpdate(task)} disabled={savingId === task.id}>{savingId === task.id ? "Sending..." : "Send update to supervisor"}</Button>{task.status !== "COMPLETED" && <Button size="sm" variant="outline" onClick={() => void completeTask(task)} disabled={savingId === task.id}><CheckCircle2 className="mr-1 h-4 w-4" />Mark complete</Button>}</div>
              {task.studentUpdatedAt && <p className="text-xs text-muted-foreground">Last sent {new Date(task.studentUpdatedAt).toLocaleString()}</p>}
            </div>
              ))}
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
