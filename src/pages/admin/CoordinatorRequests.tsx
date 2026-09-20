import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  DepartmentCoordinatorRequest,
  fetchDepartmentCoordinatorRequests,
  reviewDepartmentCoordinatorRequest,
} from "@/services/supabase-api";

const statusVariant = (status: DepartmentCoordinatorRequest["status"]) => {
  if (status === "APPROVED" || status === "ACTIVE") return "default" as const;
  if (status === "REJECTED") return "destructive" as const;
  return "secondary" as const;
};

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState<DepartmentCoordinatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await fetchDepartmentCoordinatorRequests());
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to load coordinator requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const review = async (request: DepartmentCoordinatorRequest, decision: "APPROVED" | "REJECTED") => {
    setUpdatingId(request.id);
    setError(null);
    try {
      await reviewDepartmentCoordinatorRequest(request, decision, rejectionReasons[request.id]);
      setRequests((current) => current.map((item) =>
        item.id === request.id
          ? { ...item, status: decision, reviewedAt: new Date().toISOString(), rejectionReason: rejectionReasons[request.id] || null }
          : item
      ));
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to review coordinator request.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading coordinator requests…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Department Coordinator Requests</h2>
        <p className="text-muted-foreground">Review coordinator applications before activation.</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {requests.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No Department Coordinator requests found.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const pending = request.status === "PENDING";
            return (
              <Card key={request.id} className="shadow-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{request.fullName}</CardTitle>
                    <CardDescription>{request.officialEmail}</CardDescription>
                  </div>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{request.phoneNumber}</p></div>
                    <div><p className="text-muted-foreground">Position</p><p className="font-medium">{request.positionTitle}</p></div>
                    <div><p className="text-muted-foreground">Registration date</p><p className="font-medium">{new Date(request.submittedAt).toLocaleDateString()}</p></div>
                    <div><p className="text-muted-foreground">University</p><p className="font-medium">{request.institutionName || request.institution?.name || request.institutionId || "—"}</p></div>
                    <div><p className="text-muted-foreground">Faculty / School</p><p className="font-medium">{request.facultyName || request.faculty?.name || request.facultyId || "—"}</p></div>
                    <div><p className="text-muted-foreground">Department</p><p className="font-medium">{request.departmentName || request.department?.name || request.departmentId || "—"}</p></div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="mb-1 text-muted-foreground">Coordinator responsibility</p>
                    <p>{request.coordinatorResponsibility}</p>
                  </div>
                  {pending && (
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
                      <Textarea
                        className="min-h-10 sm:flex-1"
                        placeholder="Optional reason if rejecting"
                        value={rejectionReasons[request.id] || ""}
                        onChange={(event) => setRejectionReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => void review(request, "REJECTED")} disabled={updatingId === request.id}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button onClick={() => void review(request, "APPROVED")} disabled={updatingId === request.id}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
