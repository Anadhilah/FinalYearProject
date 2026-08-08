import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet } from "@/services/auth";

type InternshipItem = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: string | null;
  duration: string | null;
  stipend: string | null;
  requirements: string | null;
  status?: string;
  createdAt?: string;
  recruiter: { id: string; name: string | null; company: string | null } | null;
};

export default function BrowseInternships() {
  const [search, setSearch] = useState("");
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInternships = async () => {
      try {
        setLoading(true);
        const res = await apiAuthenticationServiceGet("/internships");
        const payload = Array.isArray(res.data) ? res.data : [];
        setInternships(payload.filter((i: InternshipItem) => i.status !== "DRAFT"));
      } catch (err) {
        setError("Unable to load internships right now.");
      } finally {
        setLoading(false);
      }
    };

    loadInternships();
  }, []);

  const filtered = internships.filter((i) => {
    const query = search.toLowerCase();
    return (
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      (i.location ?? "").toLowerCase().includes(query) ||
      (i.recruiter?.company ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Browse Internships</h2>
        <p className="text-muted-foreground">Find your perfect internship opportunity.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, company, or location…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading internships…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No internships found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((intern) => (
            <Card key={intern.id} className="shadow-card hover:shadow-elevated transition-shadow duration-300 group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{intern.type}</span>
                </div>
                <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{intern.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{intern.recruiter?.company || intern.recruiter?.name || "Recruiter"}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location || "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{intern.duration || "—"}</span>
                </div>
                <Button size="sm" className="w-full" asChild>
                  <Link to={`/student/internships/${intern.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}