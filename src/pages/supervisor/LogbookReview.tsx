import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, CheckCircle2, XCircle, NotebookPen } from "lucide-react";

const reviewQueue = [
  {
    student: "Maya Patel",
    week: "Week 5",
    title: "Frontend improvements and testing",
    summary: "Implemented responsive dashboard updates and completed regression checks for the main modules.",
    status: "Pending review",
    hours: 22,
  },
  {
    student: "Daniel Okafor",
    week: "Week 4",
    title: "Systems internship update",
    summary: "Shared progress notes on the deployment setup and identified one issue in the staging environment.",
    status: "Needs revision",
    hours: 18,
  },
  {
    student: "Aisha Bello",
    week: "Week 3",
    title: "Campaign planning notes",
    summary: "Prepared campaign insights and explained the rationale behind the target audience segmentation.",
    status: "Approved",
    hours: 16,
  },
];

export default function SupervisorLogbooks() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Submitted work / logbook reviews</h2>
        <p className="text-muted-foreground">Review intern submissions, provide feedback, and approve or reject reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">4</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">11</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Needs revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">3</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviewQueue.map((report) => (
          <Card key={`${report.student}-${report.week}`} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span>{report.student} · {report.week}</span>
                <Badge
                  variant={
                    report.status === "Approved"
                      ? "default"
                      : report.status === "Needs revision"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {report.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{report.title}</span>
                <span>{report.hours} hours</span>
              </div>
              <p className="text-sm text-muted-foreground">{report.summary}</p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your feedback</label>
                <Textarea
                  rows={3}
                  defaultValue={
                    report.status === "Approved"
                      ? "Great work this week. Continue documenting your results clearly."
                      : report.status === "Needs revision"
                        ? "Please include a more detailed summary of the challenges you faced and how you overcame them."
                        : "Please add one more example of how the work improved the team process."
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm">
                  <FileCheck2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="outline">
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
