import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, UserRound, BriefcaseBusiness, CheckCircle2, Clock3 } from "lucide-react";
import { FacultyCoordinatorDepartmentRow, fetchFacultyCoordinatorDepartmentsData } from "@/services/supabase-api";

function formatAssignmentStatus(status?: string): string {
  if (!status) return "";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function DepartmentStat({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{title}</span>
      </div>
      <p className="mt-2 text-2xl font-bold font-display">{value}</p>
    </div>
  );
}

export default function FacultyCoordinatorDepartments() {
  const [departments, setDepartments] = useState<FacultyCoordinatorDepartmentRow[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchFacultyCoordinatorDepartmentsData();
      setDepartments(rows);
      setSelectedName((current) => current ?? rows[0]?.name ?? null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const selected =
    departments.find((department) => department.name === selectedName) ?? departments[0] ?? null;

  if (loading) return <div className="text-sm text-muted-foreground">Loading departments...</div>;
  if (!departments.length)
    return <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || "No departments available."}</div>;

  const completion = selected
    ? selected.students > 0
      ? Math.round((selected.activePlacements / selected.students) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Departments</h2>
        <p className="text-muted-foreground">Select a department to view its coordination details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="grid gap-4 content-start sm:grid-cols-2 lg:grid-cols-1">
          {departments.map((department) => {
            const isSelected = selected?.name === department.name;
            return (
              <button
                key={department.name}
                onClick={() => setSelectedName(department.name)}
                className={
                  "text-left rounded-xl border p-4 transition-colors " +
                  (isSelected
                    ? "border-primary bg-primary/5 shadow-card"
                    : "bg-card hover:border-primary/40 hover:bg-muted/20")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate">{department.name}</span>
                  </div>
                  {department.role && (
                    <Badge
                      variant={department.status === "ACTIVE" ? "secondary" : "outline"}
                      className="shrink-0"
                    >
                      {department.role}
                      {formatAssignmentStatus(department.status) ? ` · ${formatAssignmentStatus(department.status)}` : ""}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p>Assigned</p>
                    <p className="text-sm font-medium text-foreground">{department.students}</p>
                  </div>
                  <div>
                    <p>Active</p>
                    <p className="text-sm font-medium text-foreground">{department.activePlacements}</p>
                  </div>
                  <div>
                    <p>Unplaced</p>
                    <p className="text-sm font-medium text-foreground">{department.notPlaced}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{selected.name}</span>
                  </CardTitle>
                  {selected.role && (
                    <Badge variant={selected.status === "ACTIVE" ? "secondary" : "outline"} className="shrink-0">
                      {selected.role}
                      {formatAssignmentStatus(selected.status) ? ` · ${formatAssignmentStatus(selected.status)}` : ""}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DepartmentStat title="Students assigned" value={selected.students} icon={Users} />
                  <DepartmentStat title="Active placements" value={selected.activePlacements} icon={BriefcaseBusiness} />
                  <DepartmentStat title="Not yet placed" value={selected.notPlaced} icon={UserRound} />
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Placement completion</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold font-display">{completion}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Students in department
                  </span>
                  <Badge variant="outline">{selected.students} students</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selected.studentList.length === 0 && (
                  <p className="text-sm text-muted-foreground">No students assigned to this department.</p>
                )}
                {selected.studentList.map((student) => (
                  <div key={student.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <span className="text-sm font-medium">{student.name}</span>
                    {student.placed ? (
                      <Badge variant="secondary">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Placed
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock3 className="mr-1 h-3 w-3" /> Not yet placed
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}