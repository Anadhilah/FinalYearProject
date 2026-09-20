import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPinned, ArrowUpRight } from "lucide-react";

const organisations = [
  { name: "Nexa Labs", sector: "Software Engineering", students: 12, contact: "HR Manager", status: "Verified" },
  { name: "Atlas Grid", sector: "Energy Systems", students: 7, contact: "Operations Lead", status: "Needs Review" },
  { name: "BluePeak", sector: "Marketing & Strategy", students: 5, contact: "Partnership Officer", status: "Verified" },
  { name: "Harbor Logistics", sector: "Operations", students: 4, contact: "Talent Coordinator", status: "Pending" },
];

export default function DepartmentCoordinatorOrganisations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Organisations</h2>
          <p className="text-muted-foreground">See the organisations hosting your department’s students and their current status.</p>
        </div>
        <Button size="sm">Add organisation</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {organisations.map((organisation) => (
          <Card key={organisation.name} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {organisation.name}
                </span>
                <Badge variant={organisation.status === "Verified" ? "default" : organisation.status === "Needs Review" ? "secondary" : "outline"}>{organisation.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinned className="h-4 w-4" />
                {organisation.sector}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{organisation.students}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contact</span>
                <span className="font-medium">{organisation.contact}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                View organisation
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
