import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut, apiAuthenticationServicePost } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", university: "", major: "", bio: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await apiAuthenticationServiceGet("/auth/me");
        const data = res.data ?? res;
        setForm({
          name: data.name || "",
          university: data.university || "",
          major: data.major || "",
          bio: data.bio || "",
        });
        setExistingCvUrl(data.cvUrl || null);
      } catch (err) {
        setError("Unable to load your profile right now.");
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

      let cvPath = existingCvUrl;
      if (cvFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", cvFile);
        const uploadRes = await apiAuthenticationServicePost("/upload/cv", uploadForm);
        cvPath = uploadRes.data.path;
      }

      await apiAuthenticationServicePut(`/users/${user.id}`, {
        name: form.name,
        university: form.university,
        major: form.major,
        bio: form.bio,
        ...(cvPath ? { cvUrl: cvPath } : {}),
      });

      setExistingCvUrl(cvPath);
      setCvFile(null);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: "Unable to save your profile right now.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const viewCv = async () => {
    try {
      const res = await apiAuthenticationServiceGet("/users/me/cv-url");
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({ title: "Unable to open CV", description: "Could not retrieve your CV link.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading your profile…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">My Profile</h2>
        <p className="text-muted-foreground">Update your personal information and CV.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} type="email" disabled />
            </div>
            <div className="space-y-2">
              <Label>University</Label>
              <Input placeholder="e.g. MIT" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Major</Label>
              <Input placeholder="e.g. Computer Science" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea placeholder="Tell recruiters about yourself…" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Upload CV</Label>
            <label
              htmlFor="profile-cv-upload"
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              {cvFile ? (
                <p className="text-sm font-medium">{cvFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC/DOCX up to 10MB</p>
                </>
              )}
              <input
                id="profile-cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              />
            </label>
            {existingCvUrl && !cvFile && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={viewCv}>
                <FileText className="h-3.5 w-3.5" /> View current CV
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}