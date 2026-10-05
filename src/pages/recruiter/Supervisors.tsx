import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Mail, MessageCircle, RefreshCw, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMessages } from "@/contexts/MessagesContext";
import { startConversation } from "@/services/chat";
import { createCompanySupervisor, fetchRecruiterSupervisorAssignments, type RecruiterSupervisorAssignment } from "@/services/supabase-api";

export default function RecruiterSupervisors() {
  const navigate = useNavigate();
  const { refresh: refreshConversations } = useMessages();
  const [assignments, setAssignments] = useState<RecruiterSupervisorAssignment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [messagingStudentId, setMessagingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSupervisors = async () => {
    setLoading(true);
    setError(null);
    try {
      setAssignments(await fetchRecruiterSupervisorAssignments());
    } catch (loadError) {
      setError((loadError as { message?: string })?.message || "Unable to load Company Supervisors.");
    } finally {
      setLoading(false);
    }
  };

  const messageStudent = async (studentId: string) => {
    setMessagingStudentId(studentId);
    setError(null);
    try {
      const conversation = await startConversation(studentId);
      await refreshConversations();
      navigate(`/recruiter/messages?conversation=${encodeURIComponent(conversation.id)}`);
    } catch (messageError) {
      setError((messageError as { message?: string })?.message || "Unable to start a conversation with this student.");
    } finally {
      setMessagingStudentId(null);
    }
  };

  useEffect(() => { void loadSupervisors(); }, []);

  const createSupervisor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await createCompanySupervisor({ name, email });
      setTemporaryPassword({ email: result.supervisor.email, password: result.temporaryPassword });
      setName("");
      setEmail("");
      await loadSupervisors();
    } catch (createError) {
      setError((createError as { message?: string })?.message || "Unable to create Company Supervisor.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Company Supervisors</h2>
          <p className="text-muted-foreground">Create supervisor accounts for your company and assign them to internships from Applicants.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadSupervisors()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" /> Add Company Supervisor</CardTitle>
          <CardDescription>No email is sent. Share the temporary password directly; the supervisor must change it when they first sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createSupervisor} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supervisor-name">Full name</Label>
              <Input id="supervisor-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor-email">Email</Label>
              <Input id="supervisor-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <Button className="md:col-span-2 md:w-fit" disabled={creating}>
              {creating ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {temporaryPassword && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Temporary password</CardTitle>
            <CardDescription>Share this password with {temporaryPassword.email}. It is shown only once.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-md border bg-background px-3 py-2 text-sm">{temporaryPassword.password}</code>
            <Button type="button" variant="outline" onClick={() => void navigator.clipboard?.writeText(temporaryPassword.password)}>
              <Copy className="mr-2 h-4 w-4" /> Copy password
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Supervisors and assigned students</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading supervisors...</p> : assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No Company Supervisors found.</p>
          ) : (
            <div className="space-y-5">
              {assignments.map(({ supervisor, students }) => (
                <section key={supervisor.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{supervisor.name}</p>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {supervisor.email}</p>
                  </div>
                  {students.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No assigned students yet. Assign this supervisor to an internship with students from Applicants to show message actions here.</p>
                  ) : (
                    <ul className="mt-2 divide-y rounded-md border">
                      {students.map((student) => (
                        <li key={student.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{student.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[student.email, student.internshipTitles.join(", ")].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0" onClick={() => void messageStudent(student.id)} disabled={messagingStudentId === student.id}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {messagingStudentId === student.id ? "Opening..." : "Message"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}