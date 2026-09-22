import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiAuthenticationServiceGet, apiAuthenticationServicePost } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";
import { FileUploadField } from "@/components/FileUploadField";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, Clock, Loader2, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Apply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [internship, setInternship] = useState<InternshipForApply | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supportRequested, setSupportRequested] = useState<boolean | null>(null);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [coordinators, setCoordinators] = useState<DepartmentCoordinatorOption[]>([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiAuthenticationServiceGet(`/internships/${id}`);
        if (!active) return;
        const data = res.data || {};
        const questions = Array.isArray(data.applicationQuestions) ? data.applicationQuestions : [];
        const seed: Record<string, string> = {};
        for (const q of questions) {
          const key = typeof q === "string" ? q : q?.question || q?.label || "";
          if (key) seed[key] = "";
        }
        setInternship(data);
        setAnswers(seed);
      } catch (err) {
        if (active) setLoadError("Unable to load this internship right now.");
      } finally {
        if (active) setCoordinatorsLoading(false);
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const skills = (skillsInput || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const questionKeys = Object.keys(answers);

  const loadCoordinators = async () => {
    setCoordinatorsLoading(true);
    setError(null);
    try {
      const response = await apiAuthenticationServiceGet("/department-coordinators/available");
      setCoordinators(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setCoordinators([]);
      setError("Unable to load department coordinators right now.");
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!cvFile) {
      setError("Please upload your CV / resume before submitting.");
      return;
    }
    if (supportRequested === true && !selectedCoordinatorId) {
      setError("Please select a department coordinator for your support request.");
      return;
    }
    try {
      setSubmitting(true);
      const resumePath = cvFile ? await uploadToStorage("resume", cvFile) : null;
      const coverPath = coverLetterFile ? await uploadToStorage("cover-letter", coverLetterFile) : null2;
      const payload: ApplicationPayload = {
        internshipId: id,
        coverLetter: message || undefined,
        resumeUrl: resumePath || undefined,
        coverLetterUrl: coverPath || undefined,
        skills: skills.length ? skills : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        coordinatorSupportRequested: supportRequested === true ? true : undefined,
        departmentCoordinatorId: supportRequested === true ? selectedCoordinatorId : undefined,
        questionAnswers: questionKeys
          .filter((k) => (answers[k] || "").trim())
          .map((k) => ({ question: k, answer: answers[k] })),
      };
      await apiAuthenticationServicePost("/applications-list", payload);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your application right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !internship) {
    return (
      <div className="space-y-4 py-10">
        <p className="text-sm text-destructive">{loadError || "This internship could not be found."}</p>
        <Button variant="outline" onClick={() => navigate("/student/internships")}>Back to Internships</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in space-y-6">
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h3 className="font-display text-xl font-bold">Application Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              Your application for <span className="font-medium text-foreground">{internship.title}</span> has been sent.
              {internship.needsDepartmentCoordinatorApproval
                ? " Your department coordinator has been notified for review."
                : ` ${internship.recruiter?.company || internship.recruiter?.name || "The organisation"} will review it shortly.`}
            </p>
            <div className="mt-2 flex gap-3">
              <Button onClick={() => navigate("/student/applications")}>View My Applications</Button>
              <Button variant="outline" onClick={() => navigate("/student/internships")}>Browse More Internships</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <Link to={`/student/internships/${internship.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to details
        </Link>
        <h2 className="mt-1 font-display text-2xl font-bold">Apply for {internship.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{internship.location || "Remote"}</span>
          {internship.applicationDeadline && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Deadline {new Date(internship.applicationDeadline).toLocaleDateString()}</span>
          )}
          <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" />{internship.recruiter?.company}</span>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display">Application Form</CardTitle>
          <CardDescription>Fill in your details below and attach your CV.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="apply-form" onSubmit={handleSubmit} className="space-y-5">
            <FileUploadField
              id="apply-cv"
              label="CV / Resume"
              helper="PDF, DOC or DOCX — max 10MB."
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
              required
              file={cvFile}
              onFile={setCvFile}
            />

            <FileUploadField
              id="apply-cover-letter"
              label="Cover Letter (optional)"
              helper="PDF, DOC or DOCX — max 10MB."
              accept=".pdf,.doc,.docx"
              file={coverLetterFile}
              onFile={setCoverLetterFile}
            />

            <div className="space-y-2">
              <Label htmlFor="apply-message">Application Message</Label>
              <Textarea
                id="apply-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Tell the recruiter why you are a great fit for this role…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply-skills">Relevant Skills</Label>
              <Input
                id="apply-skills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. JavaScript, React, Communication"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apply-start">Expected Start Date</Label>
                <Input id="apply-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-end">Expected End Date</Label>
                <Input id="apply-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {questionKeys.length > 0 && (
              <div className="space-y-4">
                <Label>Recruiter Questions</Label>
                {questionKeys.map((q) => (
                  <div key={q} className="space-y-2">
                    <Label>{q}</Label>
                    <Textarea value={answers[q] || ""} onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })} rows={3} placeholder="Your answer…" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Department Coordinator Support <span className="text-muted-foreground">(optional)</span></Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={supportRequested === true ? "default" : "outline"} size="sm" onClick={() => { setSupportRequested(true); setSelectedCoordinatorId(""); void loadCoordinators(); }}>Yes, request support</Button>
                <Button type="button" variant={supportRequested === false ? "default" : "outline"} size="sm" onClick={() => { setSupportRequested(false); setSelectedCoordinatorId(""); }}>No, not needed</Button>
              </div>
              {supportRequested === true && (
                <div className="space-y-2">
                  <Label htmlFor="department-coordinator">Choose your department coordinator</Label>
                  <Select value={selectedCoordinatorId} onValueChange={setSelectedCoordinatorId} disabled={coordinatorsLoading || coordinators.length === 0}>
                    <SelectTrigger id="department-coordinator">
                      <SelectValue placeholder={coordinatorsLoading ? "Loading coordinators..." : "Select a coordinator"} />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinators.map((coordinator) => (
                        <SelectItem key={coordinator.id} value={coordinator.id}>
                          {coordinator.name} - {coordinator.positionTitle || "Department Coordinator"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!coordinatorsLoading && coordinators.length === 0 && <p className="text-sm text-destructive">No active department coordinators are available for your department.</p>}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
        <CardFooter className="justify-between border-t px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(`/student/internships/${internship.id}`)}>Cancel</Button>
          <Button type="submit" form="apply-form" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Submitting…</> : "Submit Application"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ============ types + helpers (kept local to this page) ============ */

type InternshipForApply = {
  id: string;
  title?: string | null;
  location?: string | null;
  applicationDeadline?: string | null;
  applicationQuestions?: Array<string | { question?: string; label?: string }> | null;
  needsDepartmentCoordinatorApproval?: boolean;
  recruiter?: { name?: string | null; company?: string | null } | null;
};

type ApplicationPayload = {
  internshipId: string;
  coverLetter?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  skills?: string[];
  startDate?: string;
  endDate?: string;
  coordinatorSupportRequested?: boolean;
  departmentCoordinatorId?: string;
  questionAnswers?: Array<{ question: string; answer: string }>;
};

type DepartmentCoordinatorOption = {
  id: string;
  name: string;
  email?: string | null;
  positionTitle?: string | null;
  department?: { name?: string | null } | null;
};

async function uploadToStorage(folder: "resume" | "cover-letter", file: File): Promise<string> {
  const res = await apiAuthenticationServicePost(`/upload/${folder}`, { file });
  return res.data?.path || "";
}
