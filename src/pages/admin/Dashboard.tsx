import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Users, Briefcase, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiAuthenticationServiceGet } from "@/services/auth";

interface Stats {
  totalStudents: number;
  totalRecruiters: number;
  activeInternships: number;
  applicationsToday: number;
}

interface ActivityEvent {
  type: string;
  message: string;
  timestamp: string;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, activityRes] = await Promise.all([
          apiAuthenticationServiceGet("/admin/stats"),
          apiAuthenticationServiceGet("/admin/recent-activity"),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">System-wide statistics at a glance.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={Users} />
        <StatCard title="Total Recruiters" value={stats?.totalRecruiters ?? 0} icon={Building2} />
        <StatCard title="Active Internships" value={stats?.activeInternships ?? 0} icon={Briefcase} />
        <StatCard title="Applications Today" value={stats?.applicationsToday ?? 0} icon={TrendingUp} />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activity.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No recent activity yet.</p>
          ) : (
            activity.map((event, i) => (
              <div
                key={i}
                className={`flex justify-between py-2 ${i < activity.length - 1 ? "border-b" : ""}`}
              >
                <span>{event.message}</span>
                <span className="text-muted-foreground">{timeAgo(event.timestamp)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}