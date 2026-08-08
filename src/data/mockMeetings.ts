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

export const mockMeetings: Meeting[] = [
  {
    id: "mt-1",
    title: "Interview – Frontend Intern",
    participantName: "Sarah Chen",
    participantRole: "recruiter",
    date: "2026-03-10",
    time: "10:00 AM",
    type: "video",
    status: "upcoming",
  },
  {
    id: "mt-2",
    title: "Portfolio Review",
    participantName: "Mike Johnson",
    participantRole: "recruiter",
    date: "2026-03-12",
    time: "2:30 PM",
    type: "voice",
    status: "upcoming",
  },
  {
    id: "mt-3",
    title: "Initial Screening",
    participantName: "Alex Rivera",
    participantRole: "student",
    date: "2026-03-01",
    time: "11:00 AM",
    type: "video",
    status: "completed",
  },
  {
    id: "mt-4",
    title: "Follow-up Discussion",
    participantName: "Emily Watson",
    participantRole: "student",
    date: "2026-02-28",
    time: "3:00 PM",
    type: "voice",
    status: "completed",
  },
];
