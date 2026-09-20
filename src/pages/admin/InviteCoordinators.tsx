import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock3, Mail, Send, UserPlus } from "lucide-react";
import { createCoordinatorInvitation, fetchCoordinatorInvitations } from "@/services/supabase-api";

interface InviteRecord {
  id: string;
  email: string;
  name: string;
  role: "Department Coordinator";
  institution: string;
  faculty: string;
  department: string;
  status: "PENDING" | "SENT" | "ACTIVATED";
  createdAt: string;
}


export default function InviteCoordinators() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    institution: "University of Lagos",
    faculty: "Engineering",
    department: "Computer Science",
  });

  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pendingCount = useMemo(
    () => invites.filter((item) => item.status === "PENDING" || item.status === "SENT").length,
    [invites]
  );

  const activatedCount = useMemo(
    () => invites.filter((item) => item.status === "ACTIVATED").length,
    [invites]
  );

  useEffect(() => {
    const loadInvites = async () => {
      setLoading(true);
      try {
        const data = await fetchCoordinatorInvitations();
        const normalized = (data || []).map((invite) => ({
          id: invite.id,
          email: invite.email,
          name: invite.name || "Department Coordinator",
          role: "Department Coordinator",
          institution: form.institution,
          faculty: form.faculty,
          department: form.department,
          status: (invite.status || "PENDING") as InviteRecord["status"],
          createdAt: invite.createdAt ? new Date(invite.createdAt).toISOString().slice(0, 10) : "—",
        }));
        setInvites(normalized);
      } catch (err) {
        console.error("Failed to load coordinator invitations:", err);
        setErrorMessage("Failed to load existing coordinator invitations.");
      } finally {
        setLoading(false);
      }
    };

    loadInvites();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.email.trim()) {
      setErrorMessage("Please enter the coordinator email.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createCoordinatorInvitation({
        name: form.name.trim() || undefined,
        email: form.email.trim(),
        role: "Department Coordinator",
      });

      const normalizedInvite: InviteRecord = {
        id: result.invitation.id,
        email: result.invitation.email,
        name: result.invitation.name || form.name.trim() || "Department Coordinator",
        role: "Department Coordinator",
        institution: form.institution,
        faculty: form.faculty,
        department: form.department,
        status: (result.invitation.status || "PENDING") as InviteRecord["status"],
        createdAt: result.invitation.createdAt ? new Date(result.invitation.createdAt).toISOString().slice(0, 10) : "—",
      };

      setInvites((previous) => [normalizedInvite, ...previous]);
      setSuccessMessage(
        `Activation email queued for ${form.email.trim()}. The coordinator can use this link: ${result.activationLink}`
      );
      setForm({
        email: "",
        name: "",
        institution: "University of Lagos",
        faculty: "Engineering",
        department: "Computer Science",
      });
    } catch (err) {
      console.error("Failed to create coordinator invitation:", err);
      setErrorMessage((err as { message?: string })?.message || "Failed to send the coordinator activation link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Invite Department Coordinators</h2>
          <p className="text-muted-foreground">
            Add coordinators by email and send a verification link for account activation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Pending invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">
              {invites.filter((item) => item.status === "SENT").length}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Activated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{activatedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            New coordinator invite
          </CardTitle>
          <CardDescription>
            This page is designed for admin-side onboarding. The invited coordinator will later receive a verification link to activate their account and complete setup.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coordinator-email">Coordinator email</Label>
                <Input
                  id="coordinator-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="department.coordinator@university.edu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinator-name">Coordinator name</Label>
                <Input
                  id="coordinator-name"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Optional at invite time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <select
                  id="institution"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.institution}
                  onChange={(event) => setForm((previous) => ({ ...previous, institution: event.target.value }))}
                >
                  <option>University of Lagos</option>
                  <option>Federal University of Technology Owerri</option>
                  <option>University of Benin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty / School</Label>
                <select
                  id="faculty"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.faculty}
                  onChange={(event) => setForm((previous) => ({ ...previous, faculty: event.target.value }))}
                >
                  <option>Engineering</option>
                  <option>School of Computing</option>
                  <option>Science</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.department}
                  onChange={(event) => setForm((previous) => ({ ...previous, department: event.target.value }))}
                >
                  <option>Computer Science</option>
                  <option>Information Systems</option>
                  <option>Statistics</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground">
                {successMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send activation link"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent coordinator invitations</CardTitle>
          <CardDescription>Track who has been invited, sent, or activated.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordinator</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>
                    <div className="font-medium">{invite.name}</div>
                    <div className="text-xs text-muted-foreground">{invite.email}</div>
                  </TableCell>
                  <TableCell>{invite.role}</TableCell>
                  <TableCell>
                    <div className="text-sm">{invite.institution}</div>
                    <div className="text-xs text-muted-foreground">
                      {invite.faculty} · {invite.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={invite.status === "ACTIVATED" ? "default" : invite.status === "SENT" ? "secondary" : "outline"}
                    >
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{invite.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
