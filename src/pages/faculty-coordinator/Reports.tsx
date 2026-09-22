import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { apiAuthenticationServiceGet } from "@/services/auth";

type Report = { title: string; type: string; date: string; status: string };

export default function FacultyCoordinatorReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await apiAuthenticationServiceGet("/faculty-coordinator/reports");
        setReports(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError((err as { message?: string })?.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };
    void loadReports();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Reports</h2>
        <p className="text-muted-foreground">Review real weekly reports submitted by students in your faculty scope.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading reports...</p> : error ? <p className="text-sm text-destructive">{error}</p> : reports.length === 0 ? <p className="text-sm text-muted-foreground">No student reports have been submitted.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  );
}
