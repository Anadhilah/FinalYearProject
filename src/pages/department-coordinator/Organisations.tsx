import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, MapPinned, RefreshCw, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiAuthenticationServiceGet } from "@/services/auth";
import { useSearchParams } from "react-router-dom";

type Organisation = {
  name: string;
  sector: string;
  location: string;
  opportunities: number;
  students: number;
  contact: string;
  status: string;
  internshipTitles: string[];
};

export default function DepartmentCoordinatorOrganisations() {
  const [searchParams] = useSearchParams();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [selected, setSelected] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganisations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAuthenticationServiceGet("/department-coordinator/organisations");
      setOrganisations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to load organisations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadOrganisations(); }, [loadOrganisations]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return organisations;
    return organisations.filter((organisation) => [
      organisation.name,
      organisation.sector,
      organisation.location,
      organisation.contact,
      ...organisation.internshipTitles,
    ].some((value) => value.toLowerCase().includes(keyword)));
  }, [organisations, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organisations</h2>
          <p className="text-muted-foreground">Inspect organisations offering internships to students in your department.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadOrganisations()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organisations..." className="pl-9" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading organisations...</p>
      ) : error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No organisations found for this department.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((organisation) => (
            <Card key={organisation.name} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="flex min-w-0 items-center gap-2"><Building2 className="h-4 w-4 shrink-0" /><span className="truncate">{organisation.name}</span></span>
                  <Badge variant={organisation.status === "Verified" ? "default" : "outline"}>{organisation.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><MapPinned className="h-4 w-4" />{organisation.location}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Industry</span><span className="font-medium">{organisation.sector}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Opportunities</span><span className="font-medium">{organisation.opportunities}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{organisation.students} students placed</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Recruiter</span><span className="max-w-[55%] truncate font-medium">{organisation.contact}</span></div>
                <Button variant="ghost" size="sm" className="mt-2 w-full justify-between" onClick={() => setSelected(organisation)}>
                  View organisation details
                  <Building2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>Organisation details from current internship records.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="text-muted-foreground">Industry / category</p><p className="font-medium">{selected.sector}</p></div>
                  <div><p className="text-muted-foreground">Location</p><p className="font-medium">{selected.location}</p></div>
                  <div><p className="text-muted-foreground">Verification</p><Badge variant={selected.status === "Verified" ? "default" : "outline"}>{selected.status}</Badge></div>
                  <div><p className="text-muted-foreground">Recruiter contact</p><p className="font-medium">{selected.contact}</p></div>
                </div>
                <div><p className="mb-2 text-muted-foreground">Internship opportunities ({selected.opportunities})</p><ul className="list-disc space-y-1 pl-5">{selected.internshipTitles.map((title) => <li key={title}>{title}</li>)}</ul></div>
                <div className="rounded-lg bg-muted/50 p-3"><p className="text-muted-foreground">Students placed</p><p className="mt-1 text-lg font-semibold">{selected.students}</p></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
