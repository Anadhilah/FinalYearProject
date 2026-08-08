import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Eye, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServiceDelete } from "@/services/auth";

type InternshipStatus = "DRAFT" | "ACTIVE" | "CLOSED";

interface Internship {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: string | null;
  duration: string | null;
  stipend: string | null;
  requirements: string | null;
  status: InternshipStatus;
  createdAt: string;
  recruiter: { id: string; name: string | null; company: string | null } | null;
  _count?: { applications: number };
}

const statusVariant: Record<InternshipStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "default",
  CLOSED: "secondary",
};

export default function AdminManageInternships() {
  const [search, setSearch] = useState("");
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Internship | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Internship | null>(null);

  const loadInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthenticationServiceGet("/internships");
      setInternships(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load internships:", err);
      setError("Failed to load internships. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, []);

  const filtered = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.recruiter?.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const viewDetails = (i: Internship) => {
    setSelected(i);
    setDetailOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiAuthenticationServiceDelete(`/internships/${deleteTarget.id}`);
      setInternships((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete internship:", err);
      setError("Failed to delete internship. Please try again.");
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading internships…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Manage Internships</h2>
        <p className="text-muted-foreground">Oversee all internship postings on the platform.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search internships…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead className="hidden sm:table-cell">Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No internships found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.recruiter?.company ?? "—"}</TableCell>
                    <TableCell>{item._count?.applications ?? 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status]} className="capitalize">
                        {item.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => viewDetails(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.recruiter?.company ?? "Unknown company"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <p className="text-muted-foreground">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem label="Location" value={selected.location ?? "—"} />
                  <DetailItem label="Type" value={selected.type ?? "—"} />
                  <DetailItem label="Duration" value={selected.duration ?? "—"} />
                  <DetailItem label="Stipend" value={selected.stipend ?? "—"} />
                  <DetailItem label="Posted by" value={selected.recruiter?.name ?? "—"} />
                  <DetailItem label="Applicants" value={String(selected._count?.applications ?? 0)} />
                </div>
                {selected.requirements && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Requirements</p>
                    <p>{selected.requirements}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this internship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

