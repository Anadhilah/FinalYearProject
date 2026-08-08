import { useState } from "react";
import { mockMeetings, Meeting } from "@/data/mockMeetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Phone, PlusCircle, Video } from "lucide-react";
import CallWindow from "@/components/chat/CallWindow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [activeCall, setActiveCall] = useState<{ name: string; mode: "video" | "voice" } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status !== "upcoming");

  const handleSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newMeeting: Meeting = {
      id: `mt-${Date.now()}`,
      title: fd.get("title") as string,
      participantName: fd.get("participant") as string,
      participantRole: "recruiter",
      date: fd.get("date") as string,
      time: fd.get("time") as string,
      type: (fd.get("type") as "video" | "voice") || "video",
      status: "upcoming",
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    setDialogOpen(false);
  };

  return (
    <>
      {activeCall && (
        <CallWindow
          callerName={activeCall.name}
          callerInitial={activeCall.name.charAt(0)}
          mode={activeCall.mode}
          onEnd={() => setActiveCall(null)}
          channelName={`meeting-${activeCall.name.toLowerCase().replace(/\s+/g, "-")}`}
          uid={2}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">Meetings</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="h-4 w-4 mr-2" />Schedule Meeting</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule a Meeting</DialogTitle></DialogHeader>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
                <div><Label htmlFor="participant">Participant</Label><Input id="participant" name="participant" required placeholder="Recruiter name" /></div>
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
                <Button type="submit" className="w-full">Schedule</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="past">Past</TabsTrigger></TabsList>
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming meetings.</p>}
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} onJoin={() => setActiveCall({ name: m.participantName, mode: m.type })} />
            ))}
          </TabsContent>
          <TabsContent value="past" className="space-y-3 mt-4">
            {past.length === 0 && <p className="text-sm text-muted-foreground">No past meetings.</p>}
            {past.map((m) => <MeetingCard key={m.id} meeting={m} />)}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function MeetingCard({ meeting, onJoin }: { meeting: Meeting; onJoin?: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {meeting.type === "video" ? <Video className="h-4 w-4 text-primary" /> : <Phone className="h-4 w-4 text-primary" />}
          </div>
          <div>
            <p className="font-medium text-sm">{meeting.title}</p>
            <p className="text-xs text-muted-foreground">with {meeting.participantName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{meeting.date} · {meeting.time}</span>
              <Badge variant={meeting.status === "upcoming" ? "default" : "secondary"} className="text-[10px] h-5">
                {meeting.status}
              </Badge>
            </div>
          </div>
        </div>
        {meeting.status === "upcoming" && onJoin && (
          <Button size="sm" onClick={onJoin}>Join</Button>
        )}
      </CardContent>
    </Card>
  );
}
