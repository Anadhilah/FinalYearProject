import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Briefcase, Users, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiAuthenticationServiceGet } from "@/services/auth";

interface InternshipItem {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  createdAt: string;
  _count: { applications: number };
}

interface ApplicationItem {
  id: string;
  status: string;
}

export default function RecruiterOverview() {
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [internshipsRes, applicationsRes] = await Promise.all([
          apiAuthenticationServiceGet("/internships/mine"),
          apiAuthenticationServiceGet("/applications-list/mine"),
        ]);
        setInternships(Array.isArray(internshipsRes.data) ? internshipsRes.data : []);
        setApplications(Array.isArray(applicationsRes.data) ? applicationsRes.data : []);
      } catch (err) {
        setError("Unable to load your dashboard right now.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activePostings = internships.filter((i) => i.status === "ACTIVE").length;
  const totalApplicants = applications.length;
  const totalViews = internships.reduce((sum, i) => sum + (i.viewCount || 0), 0);
  const hired = applications.filter((a) => a.status?.toUpperCase() === "ACCEPTED").length;

  const recentPosts = [...internships]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading your overview…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Overview</h2>
        <p className="text-muted-foreground">Your internship posting statistics.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Postings" value={activePostings} icon={Briefcase} />
        <StatCard title="Total Applicants" value={totalApplicants} icon={Users} />
        <StatCard title="Total Views" value={totalViews} icon={Eye} />
        <StatCard title="Hired" value={hired} icon={CheckCircle} />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recent Postings</CardTitle></CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No postings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{post.title}</p>
                    <p className="text-xs text-muted-foreground">Posted {new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{post._count.applications} applicants</p>
                    <p>{post.viewCount} views</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}