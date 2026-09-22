import { useCallback, useEffect, useState } from "react";
import { Check, X, ClipboardCheck, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

type Application = {
  id: string;
  status: string;
  createdAt?: string | null;
  coverLetter?: string | null;
  student?: { name?: string | null; email?: string | null } | null;
  internship?: { title?: string | null; recruiter?: { company?: string | null } | null } | null;
};

export default function DepartmentCoordinatorApplications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAuthenticationServiceGet("/department-coordinator/internship-approval");
      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load applications awaiting approval.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      await apiAuthenticationServicePut(`/department-coordinator/internship-approval/${id}/review`, { decision });
      toast({
        title: decision === "approved" ? "Application approved" : "Application rejected",
        description: decision === "approved" ? "The organisation can now review this application." : "The application will not be sent to the organisation.",
      });
      setApplications((current) => current.filter((application) => application.id !== id));
    } catch (err) {
      toast({ title: "Review failed", description: (err as { message?: string })?.message || "Unable to update this application.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Internship approval</h2>
        <p className="text-muted-foreground">Review applications from students affiliated with your department before organisations receive them.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4" /> Awaiting department review
            <Badge variant="secondary">{applications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading applications...</p>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : applications.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">There are no applications awaiting department approval.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Internship</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <p className="font-medium">{application.student?.name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{application.student?.email || "—"}</p>
                      </TableCell>
                      <TableCell>{application.internship?.title || "—"}</TableCell>
                      <TableCell>{application.internship?.recruiter?.company || "—"}</TableCell>
                      <TableCell>{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/department-coordinator/organisations?search=${encodeURIComponent(application.internship?.recruiter?.company || "")}`)}
                            disabled={!application.internship?.recruiter?.company}
                          >
                            <Building2 className="mr-1.5 h-4 w-4" /> View organisation
                          </Button>
                          <Button size="sm" onClick={() => void review(application.id, "approved")} disabled={updatingId === application.id}>
                            <Check className="mr-1.5 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => void review(application.id, "rejected")} disabled={updatingId === application.id}>
                            <X className="mr-1.5 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
