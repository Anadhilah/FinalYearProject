import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserRound, ArrowUpRight } from "lucide-react";
import { useState } from "react";

const students = [
  { name: "Maya Patel", internship: "Nexa Labs", status: "On Track", placement: "Confirmed" },
  { name: "Daniel Okafor", internship: "Atlas Grid", status: "At Risk", placement: "Confirmed" },
  { name: "Aisha Bello", internship: "BluePeak", status: "Needs Review", placement: "Confirmed" },
  { name: "Joseph Mensah", internship: "Unassigned", status: "No Placement", placement: "Pending" },
  { name: "Sarah Boateng", internship: "Harbor Logistics", status: "On Track", placement: "Confirmed" },
];

export default function DepartmentCoordinatorStudents() {
  const [search, setSearch] = useState("");

  const filtered = students.filter((student) => {
    const keyword = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(keyword) ||
      student.internship.toLowerCase().includes(keyword) ||
      student.status.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Students</h2>
          <p className="text-muted-foreground">Browse all students in your department and their internship progress.</p>
        </div>
        <Button size="sm">Add student</Button>
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
            {filtered.map((student) => (
              <div key={student.name} className="rounded-xl border p-3">
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
                  <div className="flex items-center justify-between">
                    <span>Placement</span>
                    <span className="font-medium text-foreground">{student.internship}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confirmation</span>
                    <span className="font-medium text-foreground">{student.placement}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between">
                  View details
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
