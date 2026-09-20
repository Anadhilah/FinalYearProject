import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut, apiAuthenticationServicePost } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { TABLES } from "@/lib/supabaseTables";

interface InstitutionOption {
  id: string;
  name: string;
}

interface FacultyOption {
  id: string;
  name: string;
  institutionId: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  institutionId: string;
  facultyId?: string | null;
}

interface AffiliationForm {
  id: string | null;
  institutionId: string;
  facultyId: string;
  departmentId: string;
  studentNumber: string;
}

const emptyAffiliation: AffiliationForm = {
  id: null,
  institutionId: "",
  facultyId: "",
  departmentId: "",
  studentNumber: "",
};

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", university: "", major: "", bio: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [affiliation, setAffiliation] = useState<AffiliationForm>(emptyAffiliation);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await apiAuthenticationServiceGet("/auth/me");
        const data = res.data ?? res;

        setForm({
          name: data.name || "",
          university: data.university || "",
          major: data.major || "",
          bio: data.bio || "",
        });
        setExistingCvUrl(data.cvUrl || null);

        const [institutionsRes, facultiesRes, departmentsRes, affiliationRes] = await Promise.all([
          supabase.from(TABLES.INSTITUTION).select("id, name").order("name", { ascending: true }),
          supabase.from(TABLES.FACULTY_SCHOOL).select("id, name, institutionId").order("name", { ascending: true }),
          supabase.from(TABLES.DEPARTMENT).select("id, name, institutionId, facultyId").order("name", { ascending: true }),
          supabase
            .from(TABLES.STUDENT_INSTITUTION_AFFILIATION)
            .select("id, institutionId, facultyId, departmentId, studentNumber")
            .eq("studentId", user.id)
            .maybeSingle(),
        ]);

        if (institutionsRes.error) throw institutionsRes.error;
        if (facultiesRes.error) throw facultiesRes.error;
        if (departmentsRes.error) throw departmentsRes.error;
        if (affiliationRes.error && affiliationRes.error.code !== "PGRST116") {
          throw affiliationRes.error;
        }

        setInstitutions((institutionsRes.data as InstitutionOption[]) || []);
        setFaculties((facultiesRes.data as FacultyOption[]) || []);
        setDepartments((departmentsRes.data as DepartmentOption[]) || []);

        const loadedAffiliation = affiliationRes.data as
          | {
              id: string;
              institutionId?: string | null;
              facultyId?: string | null;
              departmentId?: string | null;
              studentNumber?: string | null;
            }
          | null;

        setAffiliation(
          loadedAffiliation
            ? {
                id: loadedAffiliation.id || null,
                institutionId: loadedAffiliation.institutionId || "",
                facultyId: loadedAffiliation.facultyId || "",
                departmentId: loadedAffiliation.departmentId || "",
                studentNumber: loadedAffiliation.studentNumber || "",
              }
            : emptyAffiliation
        );
      } catch (err) {
        console.error("Failed to load student profile data:", err);
        setError("Unable to load your profile right now.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const filteredFaculties = useMemo(
    () =>
      affiliation.institutionId
        ? faculties.filter((faculty) => faculty.institutionId === affiliation.institutionId)
        : [],
    [affiliation.institutionId, faculties]
  );

  const filteredDepartments = useMemo(
    () =>
      departments.filter(
        (department) =>
          department.institutionId === affiliation.institutionId &&
          (!affiliation.facultyId || department.facultyId === affiliation.facultyId)
      ),
    [affiliation.facultyId, affiliation.institutionId, departments]
  );

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

      if (affiliation.institutionId) {
        const affiliationPayload = {
          id: affiliation.id || crypto.randomUUID(),
          studentId: user.id,
          institutionId: affiliation.institutionId,
          facultyId: affiliation.facultyId || null,
          departmentId: affiliation.departmentId || null,
          studentNumber: affiliation.studentNumber.trim() || null,
          isPrimary: true,
          startDate: null,
          endDate: null,
        };

        const { error: affiliationError } = await supabase
          .from(TABLES.STUDENT_INSTITUTION_AFFILIATION)
          .upsert(affiliationPayload, { onConflict: "id" });

        if (affiliationError) {
          throw affiliationError;
        }

        setAffiliation((prev) => ({ ...prev, id: affiliationPayload.id }));
      } else if (affiliation.id) {
        const { error: deleteAffiliationError } = await supabase
          .from(TABLES.STUDENT_INSTITUTION_AFFILIATION)
          .delete()
          .eq("id", affiliation.id);

        if (deleteAffiliationError) {
          throw deleteAffiliationError;
        }

        setAffiliation(emptyAffiliation);
      }

      setExistingCvUrl(cvPath);
      setCvFile(null);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      console.error("Failed to save student profile:", err);
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
        <p className="text-muted-foreground">Update your personal information, optional institutional affiliation, and CV.</p>
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

          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium">Institutional affiliation (optional)</h3>
              <p className="text-xs text-muted-foreground">Leave this blank if you are not affiliated with an institution.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution</Label>
                <select
                  value={affiliation.institutionId}
                  onChange={(e) => {
                    setAffiliation((prev) => ({
                      ...prev,
                      institutionId: e.target.value,
                      facultyId: "",
                      departmentId: "",
                    }));
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an institution</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Student number</Label>
                <Input
                  placeholder="e.g. 202405001"
                  value={affiliation.studentNumber}
                  onChange={(e) => setAffiliation((prev) => ({ ...prev, studentNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Faculty / School</Label>
                <select
                  value={affiliation.facultyId}
                  onChange={(e) => {
                    setAffiliation((prev) => ({ ...prev, facultyId: e.target.value, departmentId: "" }));
                  }}
                  disabled={!affiliation.institutionId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select faculty / school</option>
                  {filteredFaculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  value={affiliation.departmentId}
                  onChange={(e) => setAffiliation((prev) => ({ ...prev, departmentId: e.target.value }))}
                  disabled={!affiliation.institutionId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select department</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
