import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServiceDelete, apiAuthenticationServicePut } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

type InternshipItem = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  type: string;
  location: string;
  stipend?: string;
  requirements?: string;
  status?: string;
  createdAt?: string;
  _count?: { applications: number };
};

const emptyEditForm = {
  title: "",
  location: "",
  type: "",
  duration: "",
  stipend: "",
  description: "",
  requirements: "",
  status: "ACTIVE",
};

export default function ManageInternships() {
  const { toast } = useToast();
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<InternshipItem | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const loadInternships = async () => {
    try {
      setLoading(true);
      const res = await apiAuthenticationServiceGet('/internships/mine');
      const payload = Array.isArray(res.data) ? res.data : [];
      setInternships(payload);
    } catch (err) {
      setError('Unable to load your internship postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInternships(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiAuthenticationServiceDelete(`/internships/${id}`);
      toast({ title: 'Post deleted', description: 'The internship post was removed.' });
      await loadInternships();
    } catch (err) {
      toast({ title: 'Delete failed', description: 'Unable to remove the post.', variant: 'destructive' });
    }
  };

  const openEdit = (item: InternshipItem) => {
    setEditTarget(item);
    setEditForm({
      title: item.title || "",
      location: item.location || "",
      type: item.type || "",
      duration: item.duration || "",
      stipend: item.stipend || "",
      description: item.description || "",
      requirements: item.requirements || "",
      status: item.status || "ACTIVE",
    });
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await apiAuthenticationServicePut(`/internships/${editTarget.id}`, editForm);
      toast({ title: "Post updated", description: "Your internship listing was updated." });
      setEditTarget(null);
      await loadInternships();
    } catch (err) {
      toast({ title: "Update failed", description: "Unable to save changes right now.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Manage Internships</h2>
        <p className="text-muted-foreground">Edit or remove your internship postings.</p>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading your posts…</p>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : internships.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No internship posts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead className="hidden sm:table-cell">Posted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internships.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item._count?.applications ?? 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status || "ACTIVE"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Internship</DialogTitle>
            <DialogDescription>Update the details of this listing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Stipend</Label>
                <Input value={editForm.stipend} onChange={(e) => setEditForm({ ...editForm, stipend: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea value={editForm.requirements} onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}