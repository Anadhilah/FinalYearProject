import { useCallback, useEffect, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDepartmentCoordinatorSummaries, type SupervisorSummary } from "@/services/supabase-api";

export default function DepartmentCoordinatorSummaries() {
  const [summaries, setSummaries] = useState<SupervisorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setSummaries(await fetchDepartmentCoordinatorSummaries()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load summaries."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="space-y-6 animate-fade-in"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Department oversight</p><h2 className="text-2xl font-display font-bold">Student progress summaries</h2><p className="text-muted-foreground">View task-based supervisor updates for students routed to your department.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>{error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Supervisor summaries</CardTitle></CardHeader><CardContent className="space-y-4">{loading ? <p className="text-sm text-muted-foreground">Loading summaries...</p> : summaries.length === 0 ? <p className="text-sm text-muted-foreground">No supervisor summaries have been sent yet.</p> : summaries.map((summary) => <article key={summary.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{summary.title}</h3><p className="mt-1 text-sm text-muted-foreground">{summary.studentName || "Student"} · {summary.internshipTitle || "Internship"}</p></div><Badge variant="secondary">{summary.status}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{summary.periodStart} to {summary.periodEnd} · Faculty coordinator: {summary.facultyCoordinatorName || "Unassigned"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{summary.summary}</p></article>)}</CardContent></Card></div>;
}
