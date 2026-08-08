import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, CheckCircle, XCircle, Ban, Eye, FileText, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";

type RecruiterStatus = "pending" | "approved" | "rejected" | "suspended";

interface Recruiter {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  industry: string | null;
  registrationNumber: string | null;
  proofDocUrl: string | null;
  recruiterStatus: RecruiterStatus;
  createdAt: string;
}

const statusConfig: Record<RecruiterStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  approved: { variant: "default", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
  suspended: { variant: "secondary", label: "Suspended" },
};

export default function ManageRecruiters() {
  const [search, setSearch] = useState("");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadRecruiters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthenticationServiceGet("/users?role=RECRUITER");
      interface ApiRecruiter {
        id: string;
        name: string;
        email: string;
        company?: string | null;
        industry?: string | null;
        registrationNumber?: string | null;
        proofDocUrl?: string | null;
        recruiterStatus?: string | null;
        createdAt?: string | null;
      }
      const raw = res.data as ApiRecruiter[];
      const mapped: Recruiter[] = raw.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.company,
        industry: u.industry,
        registrationNumber: u.registrationNumber,
        proofDocUrl: u.proofDocUrl,
        recruiterStatus: (u.recruiterStatus ?? "PENDING").toLowerCase() as RecruiterStatus,
        createdAt: u.createdAt,
      }));
      setRecruiters(mapped);
    } catch (err) {
      console.error("Failed to load recruiters:", err);
      setError("Failed to load recruiters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruiters();
  }, []);

  const filtered = recruiters.filter(
    (r) =>
      (r.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.company ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: RecruiterStatus) => {
    try {
      await apiAuthenticationServicePut(`/users/${id}`, { recruiterStatus: status.toUpperCase() });
      setRecruiters((prev) => prev.map((r) => (r.id === id ? { ...r, recruiterStatus: status } : r)));
      setDetailOpen(false);
    } catch (err) {
      console.error("Failed to update recruiter status:", err);
      setError("Failed to update status. Please try again.");
    }
  };

  const viewDetails = (r: Recruiter) => {
    setSelectedRecruiter(r);
    setDetailOpen(true);
  };

  const pendingCount = recruiters.filter((r) => r.recruiterStatus === "pending").length;

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading recruiters…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-display font-bold">Manage Recruiters</h2>
          <p className="text-muted-foreground">Review and verify recruiter accounts.</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search recruiters…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recruiter</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Industry</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No recruiters found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const cfg = statusConfig[r.recruiterStatus];
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{r.company ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{r.industry ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="capitalize">{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {r.recruiterStatus === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => updateStatus(r.id, "approved")}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => updateStatus(r.id, "rejected")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {r.recruiterStatus === "approved" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => updateStatus(r.id, "suspended")}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {r.recruiterStatus === "suspended" && (
                          <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => updateStatus(r.id, "approved")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recruiter Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedRecruiter && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedRecruiter.company ?? selectedRecruiter.name ?? "Recruiter"}
                </DialogTitle>
                <DialogDescription>Recruiter verification details</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <DetailItem label="Contact" value={selectedRecruiter.name ?? "—"} />
                <DetailItem label="Email" value={selectedRecruiter.email} />
                <DetailItem label="Industry" value={selectedRecruiter.industry ?? "—"} />
                <DetailItem label="Registration #" value={selectedRecruiter.registrationNumber ?? "—"} />
                <DetailItem label="Submitted" value={new Date(selectedRecruiter.createdAt).toLocaleDateString()} />
                <DetailItem label="Status" value={statusConfig[selectedRecruiter.recruiterStatus].label} />
                {selectedRecruiter.proofDocUrl && (
                <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Proof of registration document</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={async () => {
                      try {
                        const res = await apiAuthenticationServiceGet(`/users/${selectedRecruiter.id}/proof-doc-url`);
                        window.open(res.data.url, "_blank", "noopener,noreferrer");
                      } catch (err) {
                        console.error("Failed to get document link:", err);
                      }
                    }}
                  >
                    View Document
                  </Button>
                </div>
              )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                {selectedRecruiter.recruiterStatus === "pending" && (
                  <>
                    <Button variant="outline" className="text-destructive" onClick={() => updateStatus(selectedRecruiter.id, "rejected")}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => updateStatus(selectedRecruiter.id, "approved")}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </>
                )}
                {selectedRecruiter.recruiterStatus === "approved" && (
                  <Button variant="destructive" onClick={() => updateStatus(selectedRecruiter.id, "suspended")}>
                    <Ban className="h-4 w-4 mr-1" /> Suspend
                  </Button>
                )}
                {selectedRecruiter.recruiterStatus === "suspended" && (
                  <Button onClick={() => updateStatus(selectedRecruiter.id, "approved")}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Reactivate
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