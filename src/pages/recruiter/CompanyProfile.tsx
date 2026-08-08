import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

export default function CompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    company: "",
    industry: "",
    companyWebsite: "",
    companyAddress: "",
    companySize: "",
    companyDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await apiAuthenticationServiceGet("/auth/me");
        const data = res.data;
        setForm({
          company: data.company || "",
          industry: data.industry || "",
          companyWebsite: data.companyWebsite || "",
          companyAddress: data.companyAddress || "",
          companySize: data.companySize || "",
          companyDescription: data.companyDescription || "",
        });
      } catch (err) {
        setError("Unable to load your company profile right now.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await apiAuthenticationServicePut(`/users/${user.id}`, form);
      toast({ title: "Profile updated", description: "Your company details have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: "Unable to save your company profile right now.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading your company profile…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">Company Profile</h2>
        <p className="text-muted-foreground">Update your company information.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="Acme Inc." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input placeholder="Technology" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input placeholder="https://example.com" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Input placeholder="50-200" value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>About</Label>
            <Textarea placeholder="Describe your company…" rows={4} value={form.companyDescription} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })} />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}