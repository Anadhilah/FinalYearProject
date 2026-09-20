import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BriefcaseBusiness, Building2, ClipboardCheck, AlertTriangle, CalendarClock, FileText, ArrowRight } from "lucide-react";

const stats = [
  { title: "Students in department", value: 86, icon: Users, description: "Across internship placements" },
  { title: "Assigned supervisors", value: 9, icon: ClipboardCheck, description: "4 active reviews" },
  { title: "Organisations hosting", value: 24, icon: Building2, description: "6 new this month" },
  { title: "Students without placements", value: 11, icon: AlertTriangle, description: "Needs action" },
];

const studentPlacements = [
  { student: "Maya Patel", company: "Nexa Labs", supervisor: "Dr. Adebayo", status: "On Track", endDate: "Oct 18, 2026" },
  { student: "Daniel Okafor", company: "Atlas Grid", supervisor: "Prof. Harris", status: "At Risk", endDate: "Sep 30, 2026" },
  { student: "Aisha Bello", company: "BluePeak", supervisor: "Dr. Mensah", status: "Needs Review", endDate: "Nov 02, 2026" },
  { student: "Joseph Mensah", company: "Unassigned", supervisor: "—", status: "No Placement", endDate: "—" },
];

const endingSoon = [
  { student: "Daniel Okafor", company: "Atlas Grid", daysLeft: 8 },
  { student: "Aisha Bello", company: "BluePeak", daysLeft: 15 },
  { student: "Maya Patel", company: "Nexa Labs", daysLeft: 22 },
];

const supervisorReports = [
  { supervisor: "Dr. Adebayo", topic: "Student attendance and weekly logbook review", date: "12 Aug 2026" },
  { supervisor: "Prof. Harris", topic: "Performance risk and placement concerns", date: "10 Aug 2026" },
  { supervisor: "Dr. Mensah", topic: "Progress update for three students", date: "08 Aug 2026" },
];

const organisations = [
  { name: "Nexa Labs", students: 12, sectors: "Software Engineering" },
  { name: "Atlas Grid", students: 7, sectors: "Energy Systems" },
  { name: "BluePeak", students: 5, sectors: "Marketing & Strategy" },
  { name: "Harbor Logistics", students: 4, sectors: "Operations" },
];

export default function DepartmentCoordinatorOverview() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Department Coordinator Overview</h2>
          <p className="text-muted-foreground">Track student placement progress, supervisor feedback, and department-level internship health.</p>
        </div>
        <Button className="w-fit">Export summary</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} description={stat.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students in department
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Student</th>
                  <th className="pb-2 pr-4 font-medium">Internship</th>
                  <th className="pb-2 pr-4 font-medium">Supervisor</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Ends</th>
                </tr>
              </thead>
              <tbody>
                {studentPlacements.map((student) => (
                  <tr key={student.student} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{student.student}</td>
                    <td className="py-3 pr-4">{student.company}</td>
                    <td className="py-3 pr-4">{student.supervisor}</td>
                    <td className="py-3 pr-4">
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
                    </td>
                    <td className="py-3">{student.endDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Students whose internship is ending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {endingSoon.map((student) => (
              <div key={student.student} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{student.student}</span>
                  <Badge variant="outline">{student.daysLeft} days</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{student.company}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports from supervisors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supervisorReports.map((report) => (
              <div key={`${report.supervisor}-${report.date}`} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{report.supervisor}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{report.topic}</p>
                  </div>
                  <button className="inline-flex items-center gap-1 text-primary text-xs">
                    Review <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{report.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organisations hosting students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {organisations.map((organisation) => (
              <div key={organisation.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{organisation.name}</span>
                  <Badge variant="secondary">{organisation.students} students</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{organisation.sectors}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
