import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Clock3, Users } from "lucide-react";

const placements = [
  { student: "Maya Patel", company: "Nexa Labs", supervisor: "Dr. Adebayo", progress: "72%", status: "On Track" },
  { student: "Daniel Okafor", company: "Atlas Grid", supervisor: "Prof. Harris", progress: "48%", status: "At Risk" },
  { student: "Aisha Bello", company: "BluePeak", supervisor: "Dr. Mensah", progress: "61%", status: "Needs Review" },
  { student: "Joseph Mensah", company: "Unassigned", supervisor: "—", progress: "0%", status: "No Placement" },
];

export default function DepartmentCoordinatorPlacements() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Placements</h2>
          <p className="text-muted-foreground">Monitor where students are placed and how their internship progress is tracking.</p>
        </div>
        <Button size="sm">Assign placement</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {placements.map((placement) => (
          <Card key={placement.student} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {placement.student}
                </span>
                <Badge
                  variant={
                    placement.status === "On Track"
                      ? "default"
                      : placement.status === "At Risk"
                        ? "secondary"
                        : placement.status === "Needs Review"
                          ? "outline"
                          : "destructive"
                  }
                >
                  {placement.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                {placement.company}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Supervisor: {placement.supervisor}
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-medium text-foreground">{placement.progress}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: placement.progress }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
