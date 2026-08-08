import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import api from "@/api/api";
import { apiAuthenticationServiceGet } from "@/services/auth";

interface InternshipItem {
  id: string;
  title: string;
  description?: string;
  location?: string | null;
  type?: string | null;
  duration?: string | null;
  requirements?: string | null;
  stipend?: string | null;
  createdAt?: string;
  recruiter?: {
    company?: string | null;
  };
}

export default function BrowseInternships() {
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [appliedInternshipIds, setAppliedInternshipIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const loadInternships = async () => {
      try {
const [internshipsRes, applicationsRes] = await Promise.all([
          api.get<InternshipItem[]>("/internships"),
          apiAuthenticationServiceGet("/applications-list/mine"),
        ]);

        const applicationsPayload = Array.isArray(applicationsRes.data)
          ? applicationsRes.data
          : applicationsRes.data?.data || [];

        const appliedIds = (applicationsPayload as Array<{ internshipId?: string; internship?: { id?: string } }>)
          .map((application) => application.internshipId || application.internship?.id)
          .filter(Boolean) as string[];

setInternships(internshipsRes.data || []);
        setAppliedInternshipIds(appliedIds);
      } catch (error) {
        console.error("Failed to load internships", error);
      }
    };

    loadInternships();
  }, []);

  const filtered = useMemo(() => {
    return internships.filter((intern) => {
      const title = intern.title?.toLowerCase() || "";
      const company = intern.recruiter?.company?.toLowerCase() || "";
      const keywords = (intern.requirements || "").toLowerCase();
      const searchMatch = !search || title.includes(search.toLowerCase()) || company.includes(search.toLowerCase()) || keywords.includes(search.toLowerCase());
      const locationMatch = locationFilter === "all" || (intern.location || "").toLowerCase().includes(locationFilter === "remote" ? "remote" : "ca");
      const typeMatch = typeFilter === "all" || (intern.type || "").toLowerCase().includes(typeFilter === "full" ? "full" : "part");
      return searchMatch && locationMatch && typeMatch;
    });
  }, [internships, search, locationFilter, typeFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Browse Internships</h2>
        <p className="text-muted-foreground">Find your perfect internship opportunity.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, company, or skill…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="ca">California</SelectItem>
            <SelectItem value="wa">Washington</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full">Full-time</SelectItem>
            <SelectItem value="part">Part-time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((intern) => {
          const isApplied = appliedInternshipIds.includes(intern.id);
          return (
          <Card key={intern.id} className="shadow-card hover:shadow-elevated transition-shadow duration-300 group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : "Recently posted"}</span>
              </div>
              <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{intern.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{intern.recruiter?.company || "Company"}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location || "Location TBD"}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{intern.duration || "Duration TBD"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(intern.requirements || "")
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                  ))}
              </div>
              {isApplied && (
                <div className="mb-3">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">Already Applied</Badge>
                </div>
              )}
              <Button size="sm" className="w-full" asChild>
                <Link to={`/student/internships/${intern.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>
      {!filtered.length && <p className="text-sm text-muted-foreground">No internships match your search.</p>}
    </div>
  );
}
