import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, Ban, CheckCircle, GraduationCap, Users, Briefcase, Copy, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSupervisorAssignments,
  updateUser,
  resendSupervisorInvitation,
} from "@/services/supabase-api";
import { SITE_URL } from "@/lib/siteUrl";

interface SupervisorAssignment {
  id: string;
  name: string | null;
  email: string;
  university?: string | null;
  suspended?: boolean;
  createdAt?: string | null;
}

interface StudentCounts {
  internships: { id: string; title: string }[];
  studentCount: number;
}

export default function ManageSupervisors() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [supervisors, setSupervisors] = useState<SupervisorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, StudentCounts>>({});
  const [selected, setSelected] = useState<SupervisorAssignment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadSupervisors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupervisorAssignments();
      const base = data.map((s) => ({
        id: s.id,
        name: s.name ?? null,
        email: s.email,
        university: s.university ?? null,
        suspended: !!s.suspended,
        createdAt: s.createdAt ?? null,
      }));
      setSupervisors(base);
      const countsMap: Record<string, StudentCounts> = {};
      for (const s of data) {
        countsMap[s.id] = {
          internships: (s.internships || []).map((i) => ({ id: i.id, title: i.title })),
          studentCount: s.studentCount ?? 0,
        };
      }
      setCounts(countsMap);
    } catch (err) {
      console.error("Failed to load supervisors:", err);
      setError("Failed to load supervisors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const filtered = useMemo(
    () =>
      supervisors.filter(
        (s) =>
          (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          (s.university ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [supervisors, search]
  );

  const setSuspended = async (id: string, suspended: boolean) => {
    try {
      await updateUser(id, { suspended });
      setSupervisors((prev) => prev.map((s) => (s.id === id ? { ...s, suspended } : s)));
      if (selected && selected.id === id) setSelected({ ...selected, suspended });
      setDetailOpen(false);
    } catch (err) {
      console.error("Failed to update supervisor:", err);
      setError("Failed to update supervisor. Please try again.");
    }
  };

  const resend = async (s: SupervisorAssignment) => {
    try {
      const { activationToken } = await resendSupervisorInvitation({
        name: s.name || "Supervisor",
        email: s.email,
        university: s.university || undefined,
      });
      const link = `${SITE_URL}/supervisor/activate/${activationToken}`;
      navigator.clipboard.writeText(link).then(() => {
        setCopied(s.id);
        setTimeout(() => setCopied(null), 2000);
        toast({ title: "Invitation link copied", description: "Activation link copied to your clipboard." });
      });
      setSelected((prev) => (prev ? { ...prev } : prev));
    } catch (err) {
      console.error("Failed to resend invitation:", err);
      setError("Failed to send a new invitation. Please try again.");
    }
  };

  const viewDetails = (s: SupervisorAssignment) => {
    setSelected(s);
    setDetailOpen(true);
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading supervisors…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Manage Company Internship Supervisors</h2>
        <p className="text-muted-foreground">View company internship supervisors, their assigned students, and invitations.</p>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search company internship supervisors…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Internship Supervisor</TableHead>
                <TableHead className="hidden md:table-cell">University</TableHead>
                <TableHead className="hidden sm:table-cell">Students</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned Internships</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No company internship supervisors found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{s.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{s.university ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{counts[s.id]?.studentCount ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{counts[s.id]?.internships.length ?? 0}</TableCell>
                    <TableCell>
                      {s.suspended ? (
                        <Badge variant="secondary">Suspended</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => viewDetails(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resend(s)} title="New invitation link">
                        {copied === s.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {selected.name ?? "Company Internship Supervisor"}
                </DialogTitle>
                <DialogDescription>Company Internship Supervisor details and assignments</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <DetailItem label="Name" value={selected.name ?? "—"} />
                <DetailItem label="Email" value={selected.email} />
                <DetailItem label="University" value={selected.university ?? "—"} />
                <DetailItem label="Joined" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"} />
                <DetailItem label="Status" value={selected.suspended ? "Suspended" : "Active"} />
                <DetailItem label="Students" value={String(counts[selected.id]?.studentCount ?? 0)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned Internships</p>
                {(counts[selected.id]?.internships || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No internships assigned yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {(counts[selected.id]?.internships || []).map((i) => (
                      <li key={i.id} className="flex items-center gap-2 text-sm rounded-lg bg-muted/50 px-3 py-2">
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                        {i.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                {selected.suspended ? (
                  <Button onClick={() => setSuspended(selected.id, false)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Reactivate
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => setSuspended(selected.id, true)}>
                    <Ban className="h-4 w-4 mr-1" /> Suspend
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
