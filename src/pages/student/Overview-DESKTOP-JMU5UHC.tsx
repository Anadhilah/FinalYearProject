import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { apiAuthenticationServiceGet } from "@/services/auth";

type AppStatus = "pending" | "accepted" | "rejected" | "reviewing";

function toAppStatus(status: string | undefined): AppStatus {
  const lower = (status || 'pending').toLowerCase();
  const validStatuses: string[] = ['accepted', 'rejected', 'reviewing'];
  return validStatuses.includes(lower) ? (lower as AppStatus) : 'pending';
}

type ApplicationItem = {
  id: string;
  status: string;
  createdAt?: string;
  internship?: {
    title?: string;
    recruiter?: { name?: string | null; company?: string | null } | null;
  };
};

export default function StudentOverview() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const res = await apiAuthenticationServiceGet('/applications-list/mine');
        const payload = Array.isArray(res.data) ? res.data : [];
        setApplications(payload);
      } catch (err) {
        setError('Unable to load your applications right now.');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const total = applications.length;
  const accepted = applications.filter((a) => toAppStatus(a.status) === 'accepted').length;
  const pending = applications.filter((a) => toAppStatus(a.status) === 'pending').length;
  const rejected = applications.filter((a) => toAppStatus(a.status) === 'rejected').length;

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading your overview…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Overview</h2>
        <p className="text-muted-foreground">Track your internship applications at a glance.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={total} icon={FileText} />
        <StatCard title="Accepted" value={accepted} icon={CheckCircle} />
        <StatCard title="Pending" value={pending} icon={Clock} />
        <StatCard title="Rejected" value={rejected} icon={XCircle} />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
        <CardContent>
          {recentApps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{app.internship?.title || "Untitled role"}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.internship?.recruiter?.company || app.internship?.recruiter?.name || "Unknown company"}
                      {app.createdAt ? ` · ${new Date(app.createdAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={toAppStatus(app.status)} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}