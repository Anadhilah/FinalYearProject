import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchMeetings, createMeeting, type Meeting } from "@/services/supabase-api";
import { fetchMyApplications } from "@/services/supabase-api";
import { toMeetingDisplay, type MeetingDisplay } from "@/lib/meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Phone, PlusCircle, Video } from "lucide-react";
import CallWindow from "@/components/chat/CallWindow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ApplicantStudent = { id: string; name: string; email: string };

export default function RecruiterMeetings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<MeetingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ name: string; mode: "video" | "voice" } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState<ApplicantStudent[]>([]);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadMeetings = async () => {
    const rows = await fetchMeetings();
    setMeetings(rows.map(toMeetingDisplay));
  };

  useEffect(() => {
    fetchMeetings()
      .then((rows) => setMeetings(rows.map(toMeetingDisplay)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load meetings"))
      .finally(() => setLoading(false));
  }, []);

  // Load the recruiter's applicants so they can pick a student to meet.
  const loadStudents = async () => {
    try {
      const apps = await fetchMyApplications();
      const seen = new Map<string, ApplicantStudent>();
      apps.forEach((app) => {
        const s = app.student;
        if (s?.id && s.name) {
          seen.set(s.id, { id: s.id, name: s.name, email: s.email || "" });
        }
      });
      setStudents(Array.from(seen.values()));
    } catch (err) {
      toast({ title: "Could not load applicants", description: "Please try again.", variant: "destructive" });
    }
  };

  const openDialog = () => {
    setDialogOpen(true);
    setSelectedStudentEmail("");
    loadStudents();
  };

  const handleSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.email) return;
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string)?.trim();
    const date = fd.get("date") as string;
    const time = fd.get("time") as string;
    const type = (fd.get("type") as "video" | "voice") || "video";
    const selectedStudent = students.find((s) => s.id === selectedStudentEmail);

    if (!title || !date || !time || !selectedStudent) {
      toast({ title: "Missing details", description: "Please fill in all fields and select a student.", variant: "destructive" });
      return;
    }

    const scheduledfor = new Date(`${date}T${time || "00:00"}`).toISOString();
    const payload: Omit<Meeting, "id" | "createdat"> = {
      title,
      participantname: selectedStudent.name,
      participantemail: selectedStudent.email || null,
      createdbyemail: user.email,
      scheduledfor,
      type,
      status: "upcoming",
    };

    setSaving(true);
    try {
      await createMeeting(payload);
      await loadMeetings();
      setDialogOpen(false);
      toast({ title: "Meeting scheduled", description: "The student will see it on their Meetings page." });
    } catch (err) {
      toast({ title: "Failed to schedule", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status !== "upcoming");

  return (
    <>
      {activeCall && (
        <CallWindow
          callerName={activeCall.name}
          callerInitial={activeCall.name.charAt(0)}
          mode={activeCall.mode}
          onEnd={() => setActiveCall(null)}
          channelName={`meeting-${activeCall.name.toLowerCase().replace(/\s+/g, "-")}`}
          uid={3}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">Meetings</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog}><PlusCircle className="h-4 w-4 mr-2" />Schedule Meeting</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule a Meeting</DialogTitle></DialogHeader>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div><Label htmlFor="title">Title</Label><Input id="title" name="title" required placeholder="e.g. Interview – Frontend Intern" /></div>
                <div>
                  <Label>Student</Label>
                  <Select value={selectedStudentEmail} onValueChange={setSelectedStudentEmail} required>
                    <SelectTrigger><SelectValue placeholder={students.length === 0 ? "No applicants yet" : "Select an applicant"} /></SelectTrigger>
                    <SelectContent>
                      {students.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No applicants available.</p>}
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" required /></div>
                  <div><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" required /></div>
                </div>
                <div>
                  <Label>Call Type</Label>
                  <Select name="type" defaultValue="video">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="voice">Voice Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>{saving ? "Scheduling…" : "Schedule"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading meetings…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="past">Past</TabsTrigger></TabsList>
            <TabsContent value="upcoming" className="space-y-3 mt-4">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming meetings.</p>}
              {upcoming.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <MeetingInfo meeting={m} />
                    <Button size="sm" onClick={() => setActiveCall({ name: m.participantName, mode: m.type })}>Join</Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="past" className="space-y-3 mt-4">
              {past.length === 0 && <p className="text-sm text-muted-foreground">No past meetings.</p>}
              {past.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4"><MeetingInfo meeting={m} /></CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}

function MeetingInfo({ meeting }: { meeting: MeetingDisplay }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        {meeting.type === "video" ? <Video className="h-4 w-4 text-primary" /> : <Phone className="h-4 w-4 text-primary" />}
      </div>
      <div>
        <p className="font-medium text-sm">{meeting.title}</p>
        <p className="text-xs text-muted-foreground capitalize">with {meeting.participantName}</p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{meeting.date} · {meeting.time}</span>
          <Badge variant={meeting.status === "upcoming" ? "default" : "secondary"} className="text-[10px] h-5">
            {meeting.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
