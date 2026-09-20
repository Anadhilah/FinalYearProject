import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, MapPinned } from "lucide-react";

const placements = [
  { organisation: "Nexa Labs", domain: "Software Engineering", students: 12, status: "Active" },
  { organisation: "Atlas Grid", domain: "Energy Systems", students: 7, status: "Review" },
  { organisation: "BluePeak", domain: "Marketing & Strategy", students: 5, status: "Active" },
  { organisation: "Harbor Logistics", domain: "Operations", students: 4, status: "Pending" },
];

export default function FacultyCoordinatorPlacements() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Placements</h2>
          <p className="text-muted-foreground">Track organisation placements and internship opportunities across departments.</p>
        </div>
        <Button size="sm">Add placement</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {placements.map((placement) => (
          <Card key={placement.organisation} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {placement.organisation}
                </span>
                <Badge variant={placement.status === "Active" ? "default" : placement.status === "Review" ? "secondary" : "outline"}>{placement.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinned className="h-4 w-4" />
                {placement.domain}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students placed</span>
                <span className="font-medium">{placement.students}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-center mt-2">
                View details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
