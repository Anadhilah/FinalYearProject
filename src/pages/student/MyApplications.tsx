import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet } from "@/services/auth";

type AppStatus = "pending" | "accepted" | "rejected" | "reviewing" | "department_review";

function toAppStatus(status: string | undefined, departmentApprovalRequired = false): AppStatus {
  if (departmentApprovalRequired) return "department_review";
  const lower = (status || 'pending').toLowerCase();
  const validStatuses: string[] = ['accepted', 'rejected', 'reviewing', 'department_review'];
  return validStatuses.includes(lower) ? (lower as AppStatus) : 'pending';
}

type ApplicationItem = {
  id: string;
  internshipId: string;
  status: string;
  departmentApprovalRequired?: boolean;
  createdAt?: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  internship?: {
    id?: string;
    title?: string;
    location?: string | null;
    recruiter?: { name?: string | null; company?: string | null } | null;
  };
};

export default function MyApplications() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApplicationItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const res = await apiAuthenticationServiceGet('/applications-list/mine');
        const payload = Array.isArray(res.data) ? res.data : [];
        setApplications(payload);
      } catch (err) {
        setError('Unable to load your applications right now.');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const viewDetails = (app: ApplicationItem) => {
    setSelected(app);
    setDetailOpen(true);
  };

  const viewResume = async () => {
    if (!selected) return;
    try {
      setResumeLoading(true);
      const res = await apiAuthenticationServiceGet(`/applications-list/${selected.id}/resume-url`);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get resume link:", err);
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">My Applications</h2>
        <p className="text-muted-foreground">Track the status of your internship applications.</p>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading your applications…</p>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : applications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">You have not applied to any internships yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden sm:table-cell">Date Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.internship?.title || app.internshipId}</TableCell>
                    <TableCell>{app.internship?.recruiter?.company || app.internship?.recruiter?.name || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><StatusBadge status={toAppStatus(app.status, app.departmentApprovalRequired)} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => viewDetails(app)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.internship?.title || "Application"}</DialogTitle>
                <DialogDescription>
                  {selected.internship?.recruiter?.company || selected.internship?.recruiter?.name || "Recruiter"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={toAppStatus(selected.status, selected.departmentApprovalRequired)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Applied</span>
                  <span>{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"}</span>
                </div>
                {selected.internship?.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{selected.internship.location}</span>
                  </div>
                )}
                {selected.coverLetter && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cover Letter</p>
                    <p className="text-sm leading-relaxed">{selected.coverLetter}</p>
                  </div>
                )}
                {selected.resumeUrl && (
                  <Button variant="outline" size="sm" className="w-full" onClick={viewResume} disabled={resumeLoading}>
                    {resumeLoading ? "Loading…" : "View Submitted Resume"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}