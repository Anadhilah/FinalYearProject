import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, UserRound, RefreshCw, UserCog } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

type Student = {
  id: string;
  internshipId?: string;
  name: string;
  email?: string | null;
  internship: string;
  status: string;
  placement: string;
  facultyCoordinator: string;
  facultyCoordinatorId?: string | null;
};

type FacultyCoordinator = { id: string; name: string; email?: string | null };

export default function DepartmentCoordinatorStudents() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [facultyCoordinators, setFacultyCoordinators] = useState<FacultyCoordinator[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAuthenticationServiceGet("/department-coordinator/students");
      setStudents(response.data?.students || []);
      setFacultyCoordinators(response.data?.facultyCoordinators || []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load department students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const filtered = useMemo(() => students.filter((student) => {
    const keyword = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(keyword) ||
      student.internship.toLowerCase().includes(keyword) ||
      student.status.toLowerCase().includes(keyword) ||
      student.facultyCoordinator.toLowerCase().includes(keyword)
    );
  }), [search, students]);

  const assignFacultyCoordinator = async (coordinatorId: string) => {
    if (!selected?.id) return;
    setSaving(true);
    try {
      await apiAuthenticationServicePut(`/department-coordinator/students/${selected.id}/faculty-coordinator`, {
        coordinatorId: coordinatorId || null,
      });
      const coordinator = facultyCoordinators.find((item) => item.id === coordinatorId);
      const coordinatorName = coordinator?.name || "Unassigned";
      setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, facultyCoordinatorId: coordinatorId || null, facultyCoordinator: coordinatorName } : student));
      setSelected((current) => current ? { ...current, facultyCoordinatorId: coordinatorId || null, facultyCoordinator: coordinatorName } : current);
      toast({ title: "Faculty coordinator assigned", description: `${coordinatorName} is now assigned to this student.` });
    } catch (err) {
      toast({ title: "Assignment failed", description: (err as { message?: string })?.message || "Unable to assign this faculty coordinator.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Students</h2>
          <p className="text-muted-foreground">Browse all students in your department and their internship progress.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadStudents()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh roster
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Department roster
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading students...</p>
            ) : error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No students found.</p>
            ) : filtered.map((student) => (
                <div key={student.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{student.name}</p>
                  <Badge
                    variant={
                      student.status === "On Track"
                        ? "default"
                        : student.status === "At Risk"
                          ? "secondary"
                          : student.status === "Needs Review"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="truncate">{student.email || "Email not available"}</div>
                  <div className="flex items-center justify-between">
                    <span>Placement</span>
                    <span className="font-medium text-foreground">{student.internship}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confirmation</span>
                    <span className="font-medium text-foreground">{student.placement}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Faculty coordinator</span>
                    <span className="truncate font-medium text-foreground">{student.facultyCoordinator}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between" onClick={() => setSelected(student)}>
                  View details
                  <UserCog className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.email || "Email not available"} · {selected.internship} · {selected.placement}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><Badge>{selected.status}</Badge></div>
                <div className="space-y-2">
                  <label htmlFor="student-faculty-coordinator" className="font-medium">Assign faculty coordinator</label>
                  <select
                    id="student-faculty-coordinator"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selected.facultyCoordinatorId || ""}
                    onChange={(event) => void assignFacultyCoordinator(event.target.value)}
                    disabled={saving}
                  >
                    <option value="">Unassigned</option>
                    {facultyCoordinators.map((coordinator) => <option key={coordinator.id} value={coordinator.id}>{coordinator.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
