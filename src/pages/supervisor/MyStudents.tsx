import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSupervisorStudents } from "@/services/supabase-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface StudentEntry {
  student: { id: string; name?: string | null; email?: string | null; university?: string | null; major?: string | null };
  internships: Array<{ id: string; title: string }>;
}

export default function SupervisorStudents() {
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSupervisorStudents();
        setStudents(data);
      } catch (err) {
        setError("Failed to load your students.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter(
    (s) =>
      (s.student.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.student.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.student.university || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading your students…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">My Students</h2>
        <p className="text-muted-foreground">Students assigned to the internships you supervise.</p>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-2 p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {students.length === 0 ? "No students have been assigned to your internships yet." : "No students match your search."}
              </p>
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.student.id} className="rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{s.student.name || s.student.email}</p>
                  <p className="text-sm text-muted-foreground">{s.student.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {[s.student.university, s.student.major].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Internships: {s.internships.map((i) => i.title).join(", ") || "—"}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/supervisor/students/${s.student.id}`}>View Logbooks</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
