import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, RefreshCw, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FacultyCoordinatorProfile,
  createFacultyCoordinator,
  fetchFacultyCoordinatorProfiles,
} from "@/services/supabase-api";

export default function DepartmentCoordinatorFacultyCoordinators() {
  const [coordinators, setCoordinators] = useState<FacultyCoordinatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<{ email: string; password: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCoordinators(await fetchFacultyCoordinatorProfiles());
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load Faculty Coordinators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadInvitations(); }, [loadInvitations]);

  const createCoordinator = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await createFacultyCoordinator({ name, email });
      setTemporaryPassword({ email: result.coordinator.email, password: result.temporaryPassword });
      setName("");
      setEmail("");
      await loadInvitations();
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to create Faculty Coordinator.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Faculty Coordinators</h2>
          <p className="text-muted-foreground">View Faculty Coordinators in your assigned academic structure.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadInvitations()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" /> Add Faculty Coordinator</CardTitle>
          <CardDescription>No email or activation link is sent. The account receives the same university, faculty, and department scope as you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCoordinator} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="faculty-name">Full Name</Label><Input id="faculty-name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="faculty-email">Email</Label><Input id="faculty-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <Button className="md:col-span-2 md:w-fit" disabled={creating}>{creating ? "Creating account..." : "Create account"}</Button>
          </form>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {temporaryPassword && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Temporary password</CardTitle>
            <CardDescription>Give this password directly to {temporaryPassword.email}. It will not be shown again after leaving this page.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-md border bg-background px-3 py-2 text-sm">{temporaryPassword.password}</code>
            <Button type="button" variant="outline" onClick={() => void navigator.clipboard?.writeText(temporaryPassword.password)}><Copy className="mr-2 h-4 w-4" /> Copy password</Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Faculty Coordinators</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading coordinators...</p> : coordinators.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No Faculty Coordinators found.</p> : (
            <div className="divide-y">
              {coordinators.map((coordinator) => (
                <div key={coordinator.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{coordinator.name || "Faculty Coordinator"}</p>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {coordinator.email}</p>
                    <p className="text-xs text-muted-foreground">{coordinator.assignedStudents} assigned students</p>
                  </div>
                  <Badge variant={coordinator.status === "ACTIVE" ? "default" : "secondary"}>{coordinator.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
