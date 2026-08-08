import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface InternshipOption {
  id: string;
  title: string;
}

interface RawInternship {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface LogbookReport {
  id: string;
  internshipId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  tasksPerformed: string;
  skillsLearned: string;
  challengesFaced: string;
  hoursWorked: number;
  attachmentUrls?: string | null;
  status: string;
  recruiterComment?: string | null;
  shareToken?: string | null;
  createdAt: string;
  updatedAt: string;
  internship?: InternshipOption;
}

const emptyForm = {
  internshipId: "",
  weekNumber: 1,
  startDate: "",
  endDate: "",
  tasksPerformed: "",
  skillsLearned: "",
  challengesFaced: "",
  hoursWorked: 0,
  attachmentUrls: "",
  status: "DRAFT",
};

export default function StudentLogbook() {
  const { user } = useAuth();
  const [internships, setInternships] = useState<InternshipOption[]>([]);
  const [reports, setReports] = useState<LogbookReport[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    const token = localStorage.getItem("access_token");
const [internRes, reportsRes] = await Promise.all([
      api.get<RawInternship[]>("/internships", { headers: { Authorization: `Bearer ${token}` } }),
      api.get<LogbookReport[]>("/logbooks/student", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
setInternships(
      (internRes.data || []).map((item) => ({ id: item.id, title: item.title }))
    );
    setReports(
      (reportsRes.data || []).map((item) => ({ ...item, internship: item.internship }))
    );
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Unable to load logbook data"));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const token = localStorage.getItem("access_token");
    try {
      await api.post("/logbooks", { ...form, status: form.status || "DRAFT" }, { headers: { Authorization: `Bearer ${token}` } });
      setForm(emptyForm);
      await loadData();
      setMessage("Weekly report saved.");
    } catch {
      setMessage("Unable to save report.");
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = async (reportId: string) => {
    const token = localStorage.getItem("access_token");
const res = await api.post<{ shareLink?: string }>(
      `/logbooks/${reportId}/share`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const link = res.data?.shareLink;
    if (link) {
      navigator.clipboard.writeText(link);
      setMessage("Share link copied to clipboard.");
      await loadData();
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-success/10 text-success border-success/20";
      case "NEEDS_REVISION": return "bg-warning/10 text-warning border-warning/20";
      case "SUBMITTED": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const approvedReports = useMemo(() => reports.filter((report) => report.status === "APPROVED"), [reports]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Internship Logbook</h2>
        <p className="text-muted-foreground">Create weekly internship reports and share them with university coordinators.</p>
      </div>
      {message && <div className="rounded-lg border border-border bg-card p-3 text-sm">{message}</div>}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">New Weekly Report</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Internship</Label>
              <Select value={form.internshipId} onValueChange={(value) => setForm({ ...form, internshipId: value })}>
                <SelectTrigger><SelectValue placeholder="Select internship" /></SelectTrigger>
                <SelectContent>
                  {internships.map((internship) => <SelectItem key={internship.id} value={internship.id}>{internship.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Week Number</Label>
              <Input type="number" value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tasks Performed</Label>
              <Textarea value={form.tasksPerformed} onChange={(e) => setForm({ ...form, tasksPerformed: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Skills Learned</Label>
              <Textarea value={form.skillsLearned} onChange={(e) => setForm({ ...form, skillsLearned: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Challenges Faced</Label>
              <Textarea value={form.challengesFaced} onChange={(e) => setForm({ ...form, challengesFaced: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hours Worked</Label>
              <Input type="number" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Attachment URLs</Label>
              <Input value={form.attachmentUrls} onChange={(e) => setForm({ ...form, attachmentUrls: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Report"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Your Weekly Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">Week {report.weekNumber} · {report.internship?.title || "Internship"}</p>
                    <p className="text-sm text-muted-foreground">{report.startDate} to {report.endDate}</p>
                  </div>
                  <Badge variant="outline" className={statusBadgeClass(report.status)}>{report.status}</Badge>
                </div>
                <div className="mt-3 text-sm space-y-2">
                  <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
                  <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
                  <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
                  <p><span className="font-medium">Hours:</span> {report.hoursWorked}</p>
                  {report.recruiterComment && <p><span className="font-medium">Recruiter Comment:</span> {report.recruiterComment}</p>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.status === "APPROVED" && !report.shareToken && (
                    <Button size="sm" variant="outline" onClick={() => generateShareLink(report.id)}>Create Share Link</Button>
                  )}
                  {report.shareToken && <Button size="sm" variant="outline" disabled>Share Link Ready</Button>}
                </div>
              </div>
            ))}
            {!reports.length && <p className="text-sm text-muted-foreground">No reports yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Approved Reports Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">You have {approvedReports.length} approved weekly report(s) ready for sharing.</p>
          {user?.name && <p className="mt-2 text-sm">Student: {user.name}</p>}
        </CardContent>
      </Card>
    </div>
  );
}