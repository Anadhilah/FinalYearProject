import { useEffect, useState } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchSupervisorStudents, fetchSupervisorSummaryTargets, fetchSupervisorSummaries, fetchSupervisorTasks, sendSupervisorSummary, type SupervisorSummaryTarget } from "@/services/supabase-api";
import { startConversation } from "@/services/chat";

export default function SupervisorSummaries() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [targets, setTargets] = useState<SupervisorSummaryTarget[]>([]);
  const [targetId, setTargetId] = useState("");
  const [period, setPeriod] = useState("THIS_WEEK");
  const [title, setTitle] = useState("Student progress summary");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSummaries, setSentSummaries] = useState<Array<{ id: string; title: string; studentName?: string | null; summary: string; facultyFeedback?: string | null; facultyCoordinatorId?: string | null }>>([]);

  useEffect(() => {
    Promise.all([fetchSupervisorSummaryTargets(), fetchSupervisorSummaries()]).then(([items, summaries]) => { setTargets(items); setSentSummaries(summaries); if (items[0]) setTargetId(items[0].studentId); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load assigned students.")).finally(() => setLoading(false));
  }, []);

  const range = () => {
    const end = new Date();
    const start = new Date(end);
    if (period === "LAST_MONTH") start.setMonth(start.getMonth() - 1);
    else if (period === "THIS_MONTH") start.setDate(1);
    else { const day = start.getDay(); start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); }
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  };

  const generate = async () => {
    const target = targets.find((item) => item.studentId === targetId);
    if (!target) return;
    try {
      const { start, end } = range();
      const tasks = await fetchSupervisorTasks(target.studentId);
      const relevant = tasks.filter((task) => !task.createdAt || (task.createdAt.slice(0, 10) >= start && task.createdAt.slice(0, 10) <= end));
      const completed = relevant.filter((task) => task.status === "COMPLETED").length;
      const updates = relevant.filter((task) => task.studentUpdate).map((task) => `- ${task.title}: ${task.studentUpdate}`).join("\n");
      setSummary(`Period: ${start} to ${end}\n\nTask progress: ${completed}/${relevant.length} tasks completed.\n\nStudent updates:\n${updates || "- No student updates submitted."}`);
      setError(null);
    } catch (generateError) { setError(generateError instanceof Error ? generateError.message : "Unable to generate summary."); }
  };

  const send = async () => {
    const target = targets.find((item) => item.studentId === targetId);
    if (!target || !summary.trim()) return;
    setSending(true);
    try { const dates = range(); await sendSupervisorSummary({ target, periodStart: dates.start, periodEnd: dates.end, title, summary }); setSummary(""); toast({ title: "Summary sent", description: `Sent to ${target.facultyCoordinatorName}.` }); const latest = await fetchSupervisorSummaries(); setSentSummaries(latest); }
    catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Unable to send summary."); }
    finally { setSending(false); }
  };

  const messageFacultyCoordinator = async (facultyCoordinatorId: string | null | undefined) => {
    if (!facultyCoordinatorId) return;
    try { const conversation = await startConversation(facultyCoordinatorId); navigate(`/supervisor/messages?conversation=${conversation.id}`); }
    catch (messageError) { setError(messageError instanceof Error ? messageError.message : "Unable to open conversation."); }
  };

  const target = targets.find((item) => item.studentId === targetId);
  return <div className="space-y-6 animate-fade-in"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Task-based reporting</p><h2 className="text-2xl font-display font-bold">Progress summaries</h2><p className="text-muted-foreground">Generate a period summary from assigned tasks and send it to the student&apos;s faculty coordinator.</p></div>{error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<Card className="max-w-3xl shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" />Generate summary</CardTitle></CardHeader><CardContent className="space-y-4">{loading ? <p className="text-sm text-muted-foreground">Loading assigned students...</p> : <><div className="grid gap-3 md:grid-cols-3"><Select value={targetId} onValueChange={setTargetId}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{targets.map((item) => <SelectItem key={item.studentId} value={item.studentId}>{item.studentName} · {item.internshipTitle}</SelectItem>)}</SelectContent></Select><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="THIS_WEEK">This week</SelectItem><SelectItem value="THIS_MONTH">This month</SelectItem><SelectItem value="LAST_MONTH">Last month</SelectItem></SelectContent></Select><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Summary title" /></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void generate()} disabled={!targetId}><Sparkles className="mr-2 h-4 w-4" />Generate from tasks</Button><Button onClick={() => void send()} disabled={sending || !summary.trim()}><Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send to faculty coordinator"}</Button></div><Textarea rows={10} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Generate a summary, then review or edit it before sending." />{target && <p className="text-xs text-muted-foreground">Recipient: {target.facultyCoordinatorName}</p>}</>}</CardContent></Card><Card className="max-w-3xl shadow-card"><CardHeader><CardTitle className="text-base">Sent summaries</CardTitle></CardHeader><CardContent className="space-y-3">{sentSummaries.length === 0 ? <p className="text-sm text-muted-foreground">No summaries sent yet.</p> : sentSummaries.map((item) => <div key={item.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.studentName || "Student"}</p></div><Button size="sm" variant="outline" onClick={() => void messageFacultyCoordinator(item.facultyCoordinatorId)}><MessageCircle className="mr-2 h-4 w-4" />Messages</Button></div>{item.facultyFeedback && <p className="mt-2 rounded-md bg-muted/50 p-2 text-sm"><span className="font-medium">Faculty feedback:</span> {item.facultyFeedback}</p>}</div>)}</CardContent></Card></div>;
}
