import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardList, Clock3, Flag, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { completeSupervisorTask, createSupervisorTask, deleteSupervisorTask, fetchSupervisorStudents, fetchSupervisorTasks, updateSupervisorTask, type SupervisorTask } from "@/services/supabase-api";

const priorityStyles: Record<string, string> = { URGENT: "text-destructive", HIGH: "text-orange-600", NORMAL: "text-primary", LOW: "text-muted-foreground" };

export default function AssignTasks() {
  const { studentId = "" } = useParams();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<SupervisorTask[]>([]);
  const [studentName, setStudentName] = useState("Student");
  const [internshipId, setInternshipId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<SupervisorTask["priority"]>("NORMAL");
  const [editing, setEditing] = useState<SupervisorTask | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [students, loadedTasks] = await Promise.all([fetchSupervisorStudents(), fetchSupervisorTasks(studentId)]);
      const student = students.find((row) => row.student.id === studentId);
      setStudentName(student?.student.name || "Student");
      setInternshipId(student?.internships[0]?.id || "");
      setTasks(loadedTasks);
    } catch (error) {
      toast({ title: "Could not load workspace", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (studentId) void load(); }, [studentId]);

  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "ALL" || task.status === filter), [tasks, filter]);
  const openCount = tasks.filter((task) => task.status !== "COMPLETED").length;
  const completedCount = tasks.length - openCount;
  const updateCount = tasks.filter((task) => task.studentUpdate).length;

  const createTask = async () => {
    if (!title.trim() || !internshipId) return;
    setSaving(true);
    try {
      const task = await createSupervisorTask({ title, studentId, internshipId, dueDate: dueDate || null, priority });
      setTasks((current) => [task, ...current]); setTitle(""); setDueDate(""); setPriority("NORMAL");
      toast({ title: "Task assigned", description: `${studentName} has been notified.` });
    } catch (error) { toast({ title: "Assignment failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editing?.title.trim()) return;
    setSaving(true);
    try {
      const updated = await updateSupervisorTask(editing.id, { title: editing.title, dueDate: editing.dueDate, priority: editing.priority });
      setTasks((current) => current.map((task) => task.id === updated.id ? { ...task, ...updated } : task)); setEditing(null);
      toast({ title: "Task updated", description: "The task details are saved." });
    } catch (error) { toast({ title: "Update failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const remove = async (task: SupervisorTask) => {
    if (!window.confirm("Delete this task?")) return;
    setSaving(true);
    try { await deleteSupervisorTask(task.id); setTasks((current) => current.filter((item) => item.id !== task.id)); toast({ title: "Task deleted" }); }
    catch (error) { toast({ title: "Delete failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const complete = async (task: SupervisorTask) => {
    try { await completeSupervisorTask(task.id); setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "COMPLETED", completedAt: new Date().toISOString() } : item)); }
    catch (error) { toast({ title: "Could not complete task", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
  };

  return <div className="space-y-6 animate-fade-in">
    <Link to={`/supervisor/students/${studentId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to student</Link>
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Supervisor workspace</p><h2 className="text-2xl font-display font-bold">Tasks for {studentName}</h2><p className="text-muted-foreground">Assign work, follow progress, and close the loop.</p></div><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Open tasks</p><p className="mt-1 text-2xl font-bold">{openCount}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Completed</p><p className="mt-1 text-2xl font-bold">{completedCount}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Student updates</p><p className="mt-1 text-2xl font-bold">{updateCount}</p></CardContent></Card></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />Task stream</CardTitle><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All tasks</SelectItem><SelectItem value="PENDING">Open</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem></SelectContent></Select></CardHeader><CardContent className="space-y-3">{loading ? <p className="py-8 text-sm text-muted-foreground">Loading task stream...</p> : visibleTasks.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No tasks in this view.</p> : visibleTasks.map((task) => <div key={task.id} className="rounded-lg border p-4"><div className="flex items-start gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{task.title}</p><Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>{task.status === "COMPLETED" ? "Done" : "Open"}</Badge><span className={`inline-flex items-center gap-1 text-xs font-medium ${priorityStyles[task.priority || "NORMAL"]}`}><Flag className="h-3 w-3" />{task.priority || "NORMAL"}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{task.dueDate || "No due date"}</p>{task.studentUpdate && <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm"><span className="font-semibold">Student update</span><p className="mt-1 text-muted-foreground">{task.studentUpdate}</p></div>}<div className="mt-3 flex flex-wrap gap-2">{task.status !== "COMPLETED" && <Button size="sm" variant="outline" onClick={() => void complete(task)}><CheckCircle2 className="mr-1 h-4 w-4" />Complete</Button>}<Button size="sm" variant="ghost" onClick={() => setEditing({ ...task })}><Pencil className="mr-1 h-4 w-4" />Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(task)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button></div></div></div></div>)}</CardContent></Card>
      <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />New task</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-xs text-muted-foreground">Internship ID: {internshipId || "No assigned internship"}</p><Textarea value={title} onChange={(event) => setTitle(event.target.value)} rows={4} placeholder="What needs to get done?" /><div className="grid grid-cols-2 gap-2"><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /><Select value={priority} onValueChange={(value) => setPriority(value as SupervisorTask["priority"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="NORMAL">Normal</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div><Button className="w-full" onClick={() => void createTask()} disabled={saving || loading || !title.trim() || !internshipId}><Plus className="mr-2 h-4 w-4" />Assign task</Button></CardContent></Card>
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"><Card className="w-full max-w-lg shadow-xl"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Edit task</CardTitle><Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button></CardHeader><CardContent className="space-y-4"><Textarea value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} rows={4} /><div className="grid grid-cols-2 gap-2"><Input type="date" value={editing.dueDate || ""} onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })} /><Select value={editing.priority || "NORMAL"} onValueChange={(value) => setEditing({ ...editing, priority: value as SupervisorTask["priority"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="NORMAL">Normal</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div><Button className="w-full" onClick={() => void saveEdit()} disabled={saving || !editing.title.trim()}>Save changes</Button></CardContent></Card></div>}
  </div>;
}
