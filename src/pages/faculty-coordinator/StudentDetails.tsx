import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, MessageCircle, RefreshCw, UserRound } from "lucide-react";
import { FacultyCoordinatorPlacementRow, fetchFacultyCoordinatorPlacementsData } from "@/services/supabase-api";
import { startConversation } from "@/services/chat";
import { useMessages } from "@/contexts/MessagesContext";

export default function FacultyCoordinatorStudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { refresh: refreshConversations } = useMessages();
  const [student, setStudent] = useState<FacultyCoordinatorPlacementRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const students = await fetchFacultyCoordinatorPlacementsData();
      setStudent(students.find((item) => item.studentId === studentId) || null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load student details.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { void loadStudent(); }, [loadStudent]);

  const messageStudent = async () => {
    if (!student) return;
    setMessaging(true);
    setError(null);
    try {
      await startConversation(student.studentId);
      await refreshConversations();
      navigate("/faculty-coordinator/messages");
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to start a conversation with this student.");
    } finally {
      setMessaging(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading student details...</div>;
  if (!student) return <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || "Assigned student not found."}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/faculty-coordinator/students"><ArrowLeft className="mr-2 h-4 w-4" /> Assigned students</Link>
        </Button>
        <Button variant="outline" onClick={() => void loadStudent()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div>
        <h2 className="text-2xl font-display font-bold">{student.studentName}</h2>
        <p className="text-muted-foreground">Student details and coordination actions.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4" /> Student profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><p className="text-muted-foreground">Department</p><p className="font-medium">{student.department}</p></div>
          <div><p className="text-muted-foreground">University</p><p className="font-medium">{student.university}</p></div>
          <div><p className="text-muted-foreground">Email</p><p className="font-medium">{student.studentEmail || "Not available"}</p></div>
          <div><p className="text-muted-foreground">Department coordinator</p><p className="font-medium">{student.departmentCoordinator}</p></div>
          <div><p className="text-muted-foreground">Date assigned</p><p className="font-medium">{student.dateAssigned}</p></div>
          <div><p className="text-muted-foreground">Assignment reason</p><p className="font-medium">{student.reason}</p></div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Placement and progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-muted-foreground">Organisation</p><p className="font-medium">{student.organisation}</p></div>
            <div><p className="text-muted-foreground">Internship</p><p className="font-medium">{student.internshipTitle}</p></div>
            <div><p className="text-muted-foreground">Company supervisor</p><p className="font-medium">{student.companySupervisor}</p></div>
            <div><p className="text-muted-foreground">Status</p><Badge variant={student.status === "On Track" ? "default" : "secondary"}>{student.status}</Badge></div>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={() => void messageStudent()} disabled={messaging}>
              <MessageCircle className="mr-2 h-4 w-4" /> {messaging ? "Opening..." : "Message student"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/faculty-coordinator/reports"><FileText className="mr-2 h-4 w-4" /> View reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
