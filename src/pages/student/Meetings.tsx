import { useEffect, useState } from "react";
import { fetchMeetings } from "@/services/supabase-api";
import { toMeetingDisplay, type MeetingDisplay } from "@/lib/meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Video } from "lucide-react";
import CallWindow from "@/components/chat/CallWindow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentMeetings() {
  const [meetings, setMeetings] = useState<MeetingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ name: string; mode: "video" | "voice" } | null>(null);

  useEffect(() => {
    fetchMeetings()
      .then((rows) => setMeetings(rows.map(toMeetingDisplay)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load meetings"))
      .finally(() => setLoading(false));
  }, []);

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
          uid={2}
        />
      )}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Meetings</h2>
          <p className="text-muted-foreground">Meetings scheduled with your recruiters will appear here.</p>
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
                <MeetingCard key={m.id} meeting={m} onJoin={() => setActiveCall({ name: m.participantName, mode: m.type })} />
              ))}
            </TabsContent>
            <TabsContent value="past" className="space-y-3 mt-4">
              {past.length === 0 && <p className="text-sm text-muted-foreground">No past meetings.</p>}
              {past.map((m) => <MeetingCard key={m.id} meeting={m} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}

function MeetingCard({ meeting, onJoin }: { meeting: MeetingDisplay; onJoin?: () => void }) {
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
