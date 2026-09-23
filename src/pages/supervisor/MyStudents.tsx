import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Building2, CalendarRange } from "lucide-react";
import { fetchSupervisorStudents } from "@/services/supabase-api";

export default function SupervisorStudents() {
  const [search, setSearch] = useState("");
  const [studentAssignments, setStudentAssignments] = useState<Array<{
    id: string; name: string; internship: string; company: string; department: string; status: string; nextReview: string; progress: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupervisorStudents().then((rows) => {
      setStudentAssignments(rows.map(({ student, internships }) => ({
        id: student.id,
        name: student.name || "Student",
        internship: internships[0]?.title || "No internship",
        company: internships[0]?.company || "Company not provided",
        department: student.major || "Department not provided",
        status: "Assigned",
        nextReview: "Not scheduled",
        progress: "—",
      })));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = studentAssignments.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.internship.toLowerCase().includes(search.toLowerCase()) ||
      student.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Students under your supervision</h2>
        <p className="text-muted-foreground">View assigned interns, their company placement, and current internship status.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search interns…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-3 p-4">
          {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading assigned students...</p> : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No interns match your search.</p>
            </div>
          ) : (
            filtered.map((student) => (
              <div key={student.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-base">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.internship}</p>
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Company</span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{student.company}</p>
                  </div>

                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Department</span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{student.department}</p>
                  </div>

                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarRange className="h-4 w-4" />
                      <span>Next review</span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{student.nextReview}</p>
                  </div>

                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Progress</span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{student.progress}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/supervisor/students/${student.id}`}>
                    <Button variant="outline" size="sm">
                      View internship info
                    </Button>
                  </Link>
                  <Link to={`/supervisor/students/${student.id}/tasks`}>
                    <Button variant="default" size="sm">
                      Assign tasks
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    Review reports
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
