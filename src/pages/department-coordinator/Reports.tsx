import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";

const reports = [
  { title: "Weekly department internship report", sender: "Dr. Adebayo", date: "12 Aug 2026", status: "Reviewed" },
  { title: "Student progress summary", sender: "Prof. Harris", date: "10 Aug 2026", status: "Pending" },
  { title: "Placement attendance snapshot", sender: "Dr. Mensah", date: "08 Aug 2026", status: "Reviewed" },
  { title: "Supervisor follow-up notes", sender: "Mrs. Okafor", date: "06 Aug 2026", status: "Draft" },
];

export default function DepartmentCoordinatorReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Reports</h2>
          <p className="text-muted-foreground">Review reports submitted by supervisors and department teams.</p>
        </div>
        <Button size="sm">Create report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={`${report.title}-${report.date}`} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {report.title}
                </span>
                <Badge variant={report.status === "Pending" ? "secondary" : report.status === "Draft" ? "outline" : "default"}>{report.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{report.sender}</span>
                <span>{report.date}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
