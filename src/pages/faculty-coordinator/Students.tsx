import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, RefreshCw, Search, UserRound } from "lucide-react";
import { FacultyCoordinatorPlacementRow, fetchFacultyCoordinatorPlacementsData } from "@/services/supabase-api";

export default function FacultyCoordinatorStudents() {
  const [students, setStudents] = useState<FacultyCoordinatorPlacementRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await fetchFacultyCoordinatorPlacementsData());
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load assigned students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const keyword = search.trim().toLowerCase();
  const filteredStudents = students.filter((student) =>
    [student.studentName, student.department, student.organisation, student.status]
      .some((value) => value.toLowerCase().includes(keyword))
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading assigned students...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Assigned Students</h2>
          <p className="text-muted-foreground">View and manage the students assigned to your faculty coordination scope.</p>
        </div>
        <Button variant="outline" onClick={() => void loadStudents()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assigned students..." className="pl-9" />
      </div>

      {filteredStudents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assigned students found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4" />
                  {student.studentName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{student.department}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 text-muted-foreground">
                  <span>Organisation: <strong className="font-medium text-foreground">{student.organisation}</strong></span>
                  <span>Internship: <strong className="font-medium text-foreground">{student.internshipTitle}</strong></span>
                  <span>Reports: <strong className="font-medium text-foreground">{student.reportCount}</strong></span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <Badge variant={student.status === "On Track" ? "default" : "secondary"}>{student.status}</Badge>
                  <Button asChild size="sm">
                    <Link to={`/faculty-coordinator/students/${student.studentId}`}>
                      View and manage <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
