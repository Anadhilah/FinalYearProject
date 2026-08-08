import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SharedReport {
  student?: { name?: string; email?: string };
  internship?: { title?: string };
  weekNumber?: number;
  startDate?: string;
  endDate?: string;
  tasksPerformed?: string;
  skillsLearned?: string;
  challengesFaced?: string;
  hoursWorked?: number;
  recruiterComment?: string;
}

export default function SharedLogbook() {
  const { token } = useParams();
  const [report, setReport] = useState<SharedReport | null>(null);

  useEffect(() => {
    api.get<SharedReport>(`/logbooks/share/${token}`).then((res) => setReport(res.data));
  }, [token]);

  if (!report) return <div className="p-6">Loading shared report…</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="mx-auto max-w-3xl shadow-card">
        <CardHeader>
          <CardTitle>Internship Weekly Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><span className="font-medium">Student:</span> {report.student?.name || report.student?.email}</p>
          <p><span className="font-medium">Internship:</span> {report.internship?.title}</p>
          <p><span className="font-medium">Week:</span> {report.weekNumber}</p>
          <p><span className="font-medium">Date Range:</span> {report.startDate} to {report.endDate}</p>
          <p><span className="font-medium">Tasks:</span> {report.tasksPerformed}</p>
          <p><span className="font-medium">Skills:</span> {report.skillsLearned}</p>
          <p><span className="font-medium">Challenges:</span> {report.challengesFaced}</p>
          <p><span className="font-medium">Hours Worked:</span> {report.hoursWorked}</p>
          {report.recruiterComment && <p><span className="font-medium">Recruiter Comment:</span> {report.recruiterComment}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
