import { useCallback, useEffect, useState } from "react";
import { FileText, MessageCircle, RefreshCw, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchFacultyCoordinatorSummaries, updateSupervisorSummaryFeedback, type SupervisorSummary } from "@/services/supabase-api";
import { startConversation } from "@/services/chat";

export default function FacultyCoordinatorReports() {
  const [summaries, setSummaries] = useState<SupervisorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const items = await fetchFacultyCoordinatorSummaries(); setSummaries(items); setFeedback(Object.fromEntries(items.map((item) => [item.id, item.facultyFeedback || ""]))); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load task summaries."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sendFeedback = async (summary: SupervisorSummary) => {
    setSavingId(summary.id);
    try { await updateSupervisorSummaryFeedback(summary.id, feedback[summary.id] || ""); setSummaries((current) => current.map((item) => item.id === summary.id ? { ...item, facultyFeedback: feedback[summary.id] || "", facultyFeedbackAt: new Date().toISOString() } : item)); }
    catch (feedbackError) { setError(feedbackError instanceof Error ? feedbackError.message : "Unable to send feedback."); }
    finally { setSavingId(null); }
  };

  const messageSupervisor = async (summary: SupervisorSummary) => {
    try { const conversation = await startConversation(summary.supervisorId); navigate(`/faculty-coordinator/messages?conversation=${conversation.id}`); }
    catch (messageError) { setError(messageError instanceof Error ? messageError.message : "Unable to open conversation."); }
  };

  return <div className="space-y-6 animate-fade-in">
    <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Task-based reporting</p><h2 className="text-2xl font-display font-bold">Supervisor summaries</h2><p className="text-muted-foreground">Progress summaries generated from assigned tasks and student updates.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Received summaries</CardTitle></CardHeader><CardContent className="space-y-4">{loading ? <p className="text-sm text-muted-foreground">Loading summaries...</p> : summaries.length === 0 ? <p className="text-sm text-muted-foreground">No supervisor summaries have been sent yet.</p> : summaries.map((summary) => <article key={summary.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{summary.title}</h3><p className="mt-1 text-sm text-muted-foreground">{summary.studentName || "Student"} · {summary.internshipTitle || "Internship"}</p></div><Badge variant="secondary">{summary.status}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{summary.periodStart} to {summary.periodEnd} · From {summary.supervisorName || "Company supervisor"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{summary.summary}</p><div className="mt-4 space-y-2 border-t pt-4"><Textarea rows={3} value={feedback[summary.id] || ""} onChange={(event) => setFeedback((current) => ({ ...current, [summary.id]: event.target.value }))} placeholder="Send feedback to the company supervisor..." /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void sendFeedback(summary)} disabled={savingId === summary.id || !feedback[summary.id]?.trim()}><Send className="mr-2 h-4 w-4" />{savingId === summary.id ? "Sending..." : "Send feedback"}</Button><Button size="sm" variant="outline" onClick={() => void messageSupervisor(summary)}><MessageCircle className="mr-2 h-4 w-4" />Message supervisor</Button></div>{summary.facultyFeedbackAt && <p className="text-xs text-muted-foreground">Feedback sent {new Date(summary.facultyFeedbackAt).toLocaleString()}</p>}</div></article>)}</CardContent></Card>
  </div>;
}
