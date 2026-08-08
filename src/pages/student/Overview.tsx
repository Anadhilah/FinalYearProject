import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import api from "@/api/api";

interface ApplicationItem {
  id: string;
  status: string;
  createdAt: string;
  internship?: {
    title?: string;
    company?: string;
    recruiter?: {
      company?: string | null;
    };
  };
}

export default function StudentOverview() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
const token = localStorage.getItem("access_token");
        const res = await api.get<ApplicationItem[]>("/applications-list/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications((res.data || []).filter((item: ApplicationItem) => item && typeof item === "object"));
      } catch (error) {
        console.error("Failed to load student applications", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((app) => app.status?.toUpperCase() === "ACCEPTED").length;
    const pending = applications.filter((app) => ["PENDING", "REVIEWING"].includes(app.status?.toUpperCase())).length;
    const rejected = applications.filter((app) => app.status?.toUpperCase() === "REJECTED").length;

    return { total, accepted, pending, rejected };
  }, [applications]);

  const recentApps = useMemo(() => {
    return applications
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map((app) => ({
        role: app.internship?.title || "Untitled Internship",
        company: app.internship?.recruiter?.company || app.internship?.company || "Company",
        status: (app.status?.toLowerCase() || "pending") as "pending" | "accepted" | "rejected" | "reviewing",
        date: new Date(app.createdAt).toLocaleDateString(),
      }));
  }, [applications]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Overview</h2>
        <p className="text-muted-foreground">Track your internship applications at a glance.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.total} icon={FileText} trend={loading ? "Loading..." : `${stats.total > 0 ? "+" : ""}${stats.total} total`} />
        <StatCard title="Accepted" value={stats.accepted} icon={CheckCircle} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentApps.length > 0 ? recentApps.map((app, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{app.role}</p>
                  <p className="text-xs text-muted-foreground">{app.company} · {app.date}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            )) : <p className="text-sm text-muted-foreground">No applications yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
