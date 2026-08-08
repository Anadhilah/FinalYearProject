export interface Meeting {
  id: string;
  title: string;
  participantName: string;
  participantRole: "student" | "recruiter";
  date: string; // ISO
  time: string; // e.g. "10:00 AM"
  type: "video" | "voice";
  status: "upcoming" | "completed" | "cancelled";
}
