import type { Meeting } from "@/services/supabase-api";

export type MeetingDisplay = {
  id: string;
  title: string;
  participantName: string;
  date: string;
  time: string;
  type: "video" | "voice";
  status: string;
  scheduledFor: string;
};

function to12Hour(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = m || "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

/** Converts a persisted Meeting row into the shape the Meetings UI renders. */
export function toMeetingDisplay(meeting: Meeting): MeetingDisplay {
  const day = new Date(meeting.scheduledfor);
  const date = day.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const time = to12Hour(day.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  return {
    id: meeting.id,
    title: meeting.title,
    participantName: meeting.participantname || "Someone",
    date,
    time,
    type: (meeting.type === "voice" ? "voice" : "video") as "video" | "voice",
    status: meeting.status || "upcoming",
    scheduledFor: meeting.scheduledfor,
  };
}
