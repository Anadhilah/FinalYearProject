import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ArrowUpRight } from "lucide-react";

const departments = [
  { name: "Computer Science", students: 86, supervisors: 9, activePlacements: 24, health: "Strong" },
  { name: "Business Administration", students: 71, supervisors: 8, activePlacements: 18, health: "Stable" },
  { name: "Engineering", students: 64, supervisors: 7, activePlacements: 17, health: "Strong" },
  { name: "Communications", students: 39, supervisors: 5, activePlacements: 11, health: "Needs attention" },
];

export default function FacultyCoordinatorDepartments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Departments</h2>
          <p className="text-muted-foreground">Department-level performance and coordination summary.</p>
        </div>
        <Button size="sm">Add department</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {departments.map((department) => (
          <Card key={department.name} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {department.name}
                </span>
                <Badge variant={department.health === "Needs attention" ? "outline" : "secondary"}>{department.health}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{department.students}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Supervisors</span>
                <span className="font-medium">{department.supervisors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active placements</span>
                <span className="font-medium">{department.activePlacements}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                View department
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
