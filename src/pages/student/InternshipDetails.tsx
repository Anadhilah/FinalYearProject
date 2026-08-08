import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, Building2, Calendar, DollarSign, Upload, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiAuthenticationServiceGet, apiAuthenticationServicePost } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

type InternshipDetailsType = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: string | null;
  duration: string | null;
  stipend: string | null;
  requirements: string | null;
  createdAt?: string;
  recruiter: { id: string; name: string | null; company: string | null } | null;
};

export default function InternshipDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [internship, setInternship] = useState<InternshipDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const loadInternship = async () => {
      try {
        setLoading(true);
        const [internshipRes, applicationsRes] = await Promise.all([
          apiAuthenticationServiceGet(`/internships/${id}`),
          apiAuthenticationServiceGet('/applications-list/mine'),
        ]);

        const applicationsPayload = Array.isArray(applicationsRes.data)
          ? applicationsRes.data
          : applicationsRes.data?.data || [];

        const hasApplied = (applicationsPayload as Array<{ internshipId?: string; internship?: { id?: string } }>).some(
          (application) => application.internshipId === id || application.internship?.id === id
        );

        setInternship(internshipRes.data);
        setAlreadyApplied(hasApplied);
      } catch (err) {
        setError("Unable to load this internship right now.");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadInternship();
  }, [id]);

  const handleApply = async () => {
    if (!internship || !cvFile) return;

    try {
      setSubmitting(true);

// The compat layer's /upload/* handler expects `{ file }`, not a FormData.
      const uploadRes = await apiAuthenticationServicePost("/upload/resume", { file: cvFile });
      const resumePath = uploadRes.data.path;

      await apiAuthenticationServicePost("/applications-list", {
        internshipId: internship.id,
        coverLetter,
        resumeUrl: resumePath,
      });

      setSubmitted(true);
      setAlreadyApplied(true);
      toast({ title: "Application submitted", description: "Your application has been sent successfully." });
    } catch (err) {
      toast({ title: "Application failed", description: "Your application could not be sent. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading internship details…</p>;
  if (error || !internship) return <p className="text-sm text-destructive">{error || "This internship could not be found."}</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link to="/student/internships" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">{internship.title}</h2>
            <p className="text-muted-foreground">{internship.recruiter?.company || internship.recruiter?.name || "Recruiter"}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{internship.location || "—"}</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{internship.duration || "—"}</span>
        <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{internship.stipend || "Negotiable"}</span>
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{internship.createdAt ? `Posted ${new Date(internship.createdAt).toLocaleDateString()}` : "Recently posted"}</span>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-display font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{internship.description}</p>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-2">Requirements</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{internship.requirements || "No additional requirements listed."}</p>
          </div>
        </CardContent>
      </Card>
      {alreadyApplied ? (
        <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
          You already applied for this internship. You can view the status in your applications list.
        </div>
      ) : (
        <Button size="lg" onClick={() => setApplyOpen(true)}>Apply Now</Button>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h3 className="text-lg font-display font-bold">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground">Your CV has been sent to {internship.recruiter?.company || internship.recruiter?.name || "Recruiter"}.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Apply for {internship.title}</DialogTitle>
                <DialogDescription>Upload your CV to apply. It will be shared with {internship.recruiter?.company || internship.recruiter?.name || "Recruiter"}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Resume / CV</Label>
                  <label
                    htmlFor="apply-cv"
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all block",
                      cvFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    {cvFile ? (
                      <p className="text-sm font-medium">{cvFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Upload your CV</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or DOC/DOCX — max 10MB</p>
                      </>
                    )}
                    <input id="apply-cv" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Cover Letter (optional)</Label>
                  <Textarea rows={3} placeholder="Why are you interested in this role?" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                <Button onClick={handleApply} disabled={!cvFile || submitting}>{submitting ? "Submitting…" : "Submit Application"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}