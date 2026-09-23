import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAuthenticationServiceDelete, apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";
import { startConversation } from "@/services/chat";
import { useToast } from "@/hooks/use-toast";

type AppStatus = "pending" | "accepted" | "rejected" | "reviewing";

function toAppStatus(status: string | undefined): AppStatus {
  const lower = (status || 'pending').toLowerCase();
  const validStatuses: string[] = ['accepted', 'rejected', 'reviewing'];
  return validStatuses.includes(lower) ? (lower as AppStatus) : 'pending';
}

type ApplicantItem = {
  id: string;
  status: string;
  resumeUrl?: string | null;
  createdAt?: string;
  student?: { id?: string; name?: string | null; email?: string | null };
  internship?: { id?: string; title?: string | null; supervisorId?: string | null; supervisor?: { id?: string; name?: string | null } | null };
};

type SupervisorOption = { id: string; name: string; email: string };

export default function Applicants() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeLoadingId, setResumeLoadingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [assigningSupervisorId, setAssigningSupervisorId] = useState<string | null>(null);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const res = await apiAuthenticationServiceGet('/applications-list/mine');
      const payload = Array.isArray(res.data) ? res.data : [];
      setApplicants(payload);
      const supervisorsRes = await apiAuthenticationServiceGet("/recruiter/supervisors");
      setSupervisors(Array.isArray(supervisorsRes.data) ? supervisorsRes.data : []);
    } catch (err) {
      setError('Unable to load applicants right now.');
    } finally {
      setLoading(false);
    }
  };

  const assignSupervisor = async (application: ApplicantItem, supervisorId: string) => {
    if (!application.internship?.id) return;
    try {
      setAssigningSupervisorId(application.id);
      await apiAuthenticationServicePut(`/recruiter/internships/${application.internship.id}/supervisor`, { supervisorId: supervisorId || null });
      const supervisor = supervisors.find((item) => item.id === supervisorId);
      setApplicants((current) => current.map((item) => item.internship?.id === application.internship?.id
        ? { ...item, internship: { ...item.internship, supervisorId: supervisorId || null, supervisor: supervisor ? { id: supervisor.id, name: supervisor.name } : null } }
        : item));
      toast({ title: "Supervisor assigned", description: `${supervisor?.name || "Supervisor"} is now assigned to this internship.` });
    } catch (err) {
      toast({ title: "Assignment failed", description: (err as { message?: string })?.message || "Could not assign the supervisor.", variant: "destructive" });
    } finally {
      setAssigningSupervisorId(null);
    }
  };

  useEffect(() => { loadApplicants(); }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiAuthenticationServicePut(`/applications-list/${id}/status`, { status });
      toast({ title: 'Status updated', description: `Application marked as ${status}.` });
      await loadApplicants();
    } catch (err) {
      toast({ title: 'Update failed', description: 'Could not update the application status.', variant: 'destructive' });
    }
  };

  const removeApplication = async (id: string) => {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await apiAuthenticationServiceDelete(`/applications-list/${id}`);
      setApplicants((current) => current.filter((app) => app.id !== id));
      toast({ title: "Application deleted", description: "The application was removed." });
    } catch (err) {
      toast({ title: "Delete failed", description: (err as { message?: string })?.message || "Unable to delete this application.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const viewResume = async (id: string) => {
    try {
      setResumeLoadingId(id);
      const res = await apiAuthenticationServiceGet(`/applications-list/${id}/resume-url`);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({ title: 'Unable to open CV', description: 'Could not retrieve the resume link.', variant: 'destructive' });
    } finally {
      setResumeLoadingId(null);
    }
  };

  const handleMessage = async (studentId: string) => {
    try {
      setMessagingId(studentId);
      await startConversation(studentId);
      navigate("/recruiter/messages");
    } catch (err) {
      toast({ title: "Unable to start conversation", description: "Please try again.", variant: "destructive" });
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Applicants</h2>
        <p className="text-muted-foreground">Review and manage applicants for your internships.</p>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading applicants…</p>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : applicants.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No applications have been submitted yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div>
                          <p>{app.student?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{app.student?.email}</p>
                        </div>
                        {app.student?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => handleMessage(app.student!.id!)}
                            disabled={messagingId === app.student.id}
                            title="Message this student"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{app.internship?.title || "—"}</p>
                      {toAppStatus(app.status) === "accepted" && (
                        <Select value={app.internship?.supervisorId || "unassigned"} onValueChange={(value) => void assignSupervisor(app, value === "unassigned" ? "" : value)} disabled={assigningSupervisorId === app.id}>
                          <SelectTrigger className="mt-2 h-8 w-44 text-xs"><SelectValue placeholder="Assign supervisor" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">No supervisor</SelectItem>
                            {supervisors.map((supervisor) => <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.resumeUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary gap-1.5"
                          onClick={() => viewResume(app.id)}
                          disabled={resumeLoadingId === app.id}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="hidden md:inline text-xs">{resumeLoadingId === app.id ? "Loading…" : "View CV"}</span>
                          <Download className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No CV</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={toAppStatus(app.status)} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select onValueChange={(value) => handleStatusUpdate(app.id, value)}>
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Action" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                            <SelectItem value="reviewing">Review</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => void removeApplication(app.id)} disabled={deletingId === app.id} title="Delete application">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}