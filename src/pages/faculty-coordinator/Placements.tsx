import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search } from "lucide-react";
import { FacultyCoordinatorPlacementRow, fetchFacultyCoordinatorPlacementsData } from "@/services/supabase-api";

export default function FacultyCoordinatorPlacements() {
  const [placements, setPlacements] = useState<FacultyCoordinatorPlacementRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlacements(await fetchFacultyCoordinatorPlacementsData());
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load assigned students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const keyword = search.trim().toLowerCase();
  const filteredPlacements = placements.filter((placement) =>
    [placement.studentName, placement.department, placement.departmentCoordinator, placement.organisation, placement.status, placement.reason]
      .some((value) => value.toLowerCase().includes(keyword))
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading assigned students...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Students Assigned to Me</h2>
          <p className="text-muted-foreground">Review students assigned to you and their current placement details.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned students</CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assigned students..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Department coordinator</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Placement status</TableHead>
                <TableHead>Date assigned</TableHead>
                <TableHead>Reason for assignment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlacements.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{error || "No students have been assigned to you."}</TableCell></TableRow>
              ) : filteredPlacements.map((placement) => (
                <TableRow key={placement.id}>
                  <TableCell className="font-medium">{placement.studentName}</TableCell>
                  <TableCell>{placement.department}</TableCell>
                  <TableCell>{placement.departmentCoordinator}</TableCell>
                  <TableCell>{placement.organisation}</TableCell>
                  <TableCell><Badge variant={placement.status === "On Track" ? "default" : placement.status === "Needs Review" ? "secondary" : "outline"}>{placement.status}</Badge></TableCell>
                  <TableCell>{placement.dateAssigned}</TableCell>
                  <TableCell>{placement.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
