import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";

const reports = [
  { title: "Weekly internship progress report", type: "Faculty report", date: "12 Aug 2026", status: "Ready" },
  { title: "Organisation performance summary", type: "Analytics", date: "11 Aug 2026", status: "Review" },
  { title: "Supervisor activity log", type: "Operations", date: "09 Aug 2026", status: "Draft" },
  { title: "Department completion overview", type: "Departmental", date: "06 Aug 2026", status: "Ready" },
];

export default function FacultyCoordinatorReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Reports</h2>
          <p className="text-muted-foreground">Review generated analytics and export coordination reports.</p>
        </div>
        <Button size="sm">Create report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {report.title}
                </span>
                <Badge variant={report.status === "Review" ? "secondary" : report.status === "Draft" ? "outline" : "default"}>{report.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{report.type}</span>
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
