import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Copy, Check } from "lucide-react";
import { LOGBOOK_STATUS_LABELS } from "@/lib/logbookStatus";
import { SITE_URL } from "@/lib/siteUrl";

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
  supervisorComment?: string | null;
  shareToken?: string | null;
  createdAt: string;
  updatedAt: string;
  internship?: InternshipOption;
}

interface SupervisorInvitation {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  university?: string | null;
  phone?: string | null;
  status: string;
  activatedAt?: string | null;
  createdAt?: string | null;
  internship?: { id?: string; title?: string | null } | null;
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
  const { toast } = useToast();
  const [internships, setInternships] = useState<InternshipOption[]>([]);
  const [reports, setReports] = useState<LogbookReport[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<SupervisorInvitation[]>([]);
  const [invForm, setInvForm] = useState({ name: "", email: "", department: "", university: "", phone: "", internshipId: "" });
  const [invLoading, setInvLoading] = useState(false);
  const [invMessage, setInvMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const loadInvitations = async () => {
    try {
      const res = await api.get<SupervisorInvitation[]>("/supervisor/invitations", {});
      setInvitations((res.data || []));
    } catch {
      // Non-fatal: the supervisor section can hide failures.
    }
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Unable to load logbook data"));
    loadInvitations();
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
      case "APPROVED":
      case "SUPERVISOR_APPROVED":
      case "COMPLETED":
        return "bg-success/10 text-success border-success/20";
      case "NEEDS_REVISION":
      case "RECRUITER_CHANGES_REQUESTED":
      case "SUPERVISOR_CHANGES_REQUESTED":
        return "bg-warning/10 text-warning border-warning/20";
      case "SUBMITTED":
      case "PENDING_RECRUITER_REVIEW":
      case "PENDING_SUPERVISOR_REVIEW":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const submitInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.name || !invForm.email) {
      setInvMessage("Please provide the supervisor name and email.");
      return;
    }
    setInvLoading(true);
    setInvMessage(null);
    try {
      const res = await api.post<Record<string, unknown>>(
        "/supervisor/invitations",
        { ...invForm, university: invForm.university || user?.university || "" },
        {}
      );
      const data = (res.data || {}) as Record<string, unknown>;
      const activationToken = typeof data.activationToken === "string" ? data.activationToken : "";
      const invitation = (data.invitation || {}) as { id?: string };
      const invitationId = typeof invitation.id === "string" ? invitation.id : "";
      if (activationToken && invitationId) {
        // Dev path: keep the raw token on the student's own device so they can
        // re-copy the activation link (it is never stored in the database).
        try {
          localStorage.setItem(`ic_invite_${invitationId}`, activationToken);
        } catch {
          /* ignore quota errors */
        }
      }
      setInvMessage(
        activationToken
          ? `Invitation created! Send this link to your supervisor:\n${SITE_URL}/supervisor/activate/${activationToken}`
          : "Supervisor invitation created. Ask your supervisor to check for the activation email."
      );
      setInvForm({ name: "", email: "", department: "", university: "", phone: "", internshipId: "" });
      await loadInvitations();
    } catch (err) {
      setInvMessage("Unable to create the supervisor invitation.");
    } finally {
      setInvLoading(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${SITE_URL}/supervisor/activate/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
      toast({ title: "Link copied", description: "Activation link copied to your clipboard." });
    });
  };

  const approvedReports = useMemo(() => reports.filter((report) => report.status === "APPROVED" || report.status === "SUPERVISOR_APPROVED" || report.status === "COMPLETED"), [reports]);

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
                  <Badge variant="outline" className={statusBadgeClass(report.status)}>{LOGBOOK_STATUS_LABELS[report.status] || report.status}</Badge>
                </div>
                <div className="mt-3 text-sm space-y-2">
                  <p><span className="font-medium">Tasks:</span> {report.tasksPerformed || "—"}</p>
                  <p><span className="font-medium">Skills:</span> {report.skillsLearned || "—"}</p>
                  <p><span className="font-medium">Challenges:</span> {report.challengesFaced || "—"}</p>
                  <p><span className="font-medium">Hours:</span> {report.hoursWorked}</p>
                  {report.recruiterComment && <p><span className="font-medium">Recruiter Comment:</span> {report.recruiterComment}</p>}
                  {report.supervisorComment && <p><span className="font-medium">Supervisor Comment:</span> {report.supervisorComment}</p>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(report.status === "APPROVED" || report.status === "SUPERVISOR_APPROVED" || report.status === "COMPLETED") && !report.shareToken && (
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> University Supervisor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Invite your university supervisor so they can review and approve your weekly reports.
          </p>
          {invMessage && <div className="rounded-lg border border-border bg-card p-3 text-sm whitespace-pre-line">{invMessage}</div>}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submitInvitation}>
            <div className="space-y-2">
              <Label>Supervisor Full Name</Label>
              <Input value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} placeholder="e.g. Dr. Jane Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Supervisor Email</Label>
              <Input type="email" value={invForm.email} onChange={(e) => setInvForm({ ...invForm, email: e.target.value })} placeholder="supervisor@university.edu" required />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={invForm.department} onChange={(e) => setInvForm({ ...invForm, department: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label>University</Label>
              <Input value={invForm.university || user?.university || ""} onChange={(e) => setInvForm({ ...invForm, university: e.target.value })} placeholder="University name" />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input value={invForm.phone} onChange={(e) => setInvForm({ ...invForm, phone: e.target.value })} placeholder="+1 555 000 1234" />
            </div>
            <div className="space-y-2">
              <Label>Internship (optional)</Label>
              <Select value={invForm.internshipId} onValueChange={(value) => setInvForm({ ...invForm, internshipId: value })}>
                <SelectTrigger><SelectValue placeholder="Select internship" /></SelectTrigger>
                <SelectContent>
                  {internships.map((internship) => <SelectItem key={internship.id} value={internship.id}>{internship.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={invLoading}>{invLoading ? "Sending…" : "Send Invitation"}</Button>
            </div>
          </form>

          {invitations.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Invitations sent</p>
              {invitations.map((inv) => {
                const savedToken = localStorage.getItem(`ic_invite_${inv.id}`);
                return (
                  <div key={inv.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{inv.name} · {inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.internship?.title ? `${inv.internship.title} · ` : ""}{inv.status === "ACTIVE" || inv.activatedAt ? "Activated" : "Invitation sent"}
                      </p>
                    </div>
                    {savedToken && !inv.activatedAt ? (
                      <Button size="sm" variant="outline" onClick={() => copyInviteLink(savedToken)}>
                        {copied === inv.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-1">{copied === inv.id ? "Copied" : "Copy Link"}</span>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}