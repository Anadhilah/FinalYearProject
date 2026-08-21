import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MapPin, ShieldCheck, User, CheckCircle,
  ArrowRight, ArrowLeft, FileText, Loader2
} from "lucide-react";
import { apiAuthenticationServicePut, apiAuthenticationServicePost } from "@/services/auth";

const STEPS: { label: string; icon: typeof Building2 }[] = [
  { label: "Company", icon: Building2 },
  { label: "Location", icon: MapPin },
  { label: "Verification", icon: ShieldCheck },
  { label: "HR Contact", icon: User },
  { label: "Review", icon: CheckCircle },
];

const INDUSTRY_OPTIONS = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Marketing & Media", "Consulting", "Real Estate", "Other",
];

const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: only recruiters may complete onboarding.
  useEffect(() => {
    if (!user) {
      navigate("/register");
      return;
    }
    if (user.role !== "recruiter") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    companyWebsite: "",
    companySize: "",
    companyDescription: "",
    companyAddress: "",
    country: "",
    city: "",
    registrationNumber: "",
    taxId: "",
    proofFile: null as File | null,
    proofFileName: "",
    hrName: "",
    hrEmail: "",
    hrPhone: "",
    hrTitle: "",
  });

  // Prefill from user object (e.g. HR name/email captured at registration).
  useEffect(() => {
    if (user?.id) {
      setForm((prev) => ({
        ...prev,
        companyName: user.company ?? prev.companyName,
        hrName: user.hrName ?? prev.hrName,
        hrEmail: user.hrEmail ?? prev.hrEmail,
      }));
    }
  }, [user]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = (current: number): string | null => {
    switch (current) {
      case 0:
        if (!form.companyName.trim()) return "Company name is required.";
        if (!form.industry) return "Please select an industry.";
        if (form.companyWebsite && !/^https?:\/\/.+\..+/.test(form.companyWebsite)) {
          return "Website must be a valid URL (e.g. https://company.com).";
        }
        return null;
      case 1:
        if (!form.companyAddress.trim()) return "Street address is required.";
        if (!form.city.trim()) return "City is required.";
        if (!form.country.trim()) return "Country is required.";
        return null;
      case 2:
        if (!form.registrationNumber.trim()) return "Business registration number is required.";
        if (!form.proofFile) return "Please upload a business registration document.";
        return null;
      case 3:
        if (!form.hrName.trim()) return "HR/contact person name is required.";
        if (!form.hrEmail.trim() || !/\S+@\S+\.\S+/.test(form.hrEmail)) {
          return "A valid HR/contact email is required.";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step === 0) {
      navigate("/");
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    updateField("proofFile", file);
    updateField("proofFileName", file?.name ?? "");
  };

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) return;
    setLoading(true);
    setError(null);
    try {
      // 1) Upload proof document (if any)
      let proofDocUrl = "";
      if (form.proofFile) {
        const fd = new FormData();
        fd.append("file", form.proofFile);
        const uploadRes = await apiAuthenticationServicePost("/upload/proof-doc", fd);
        proofDocUrl = uploadRes?.data?.path ?? "";
      }

      // 2) Update the user record with onboarding info.
      const updatePayload: Record<string, unknown> = {
        company: form.companyName,
        industry: form.industry,
        companyWebsite: form.companyWebsite,
        companySize: form.companySize,
        companyDescription: form.companyDescription,
        companyAddress: `${form.companyAddress.trim()}${form.city.trim() ? `, ${form.city.trim()}` : ""}${form.country.trim() ? `, ${form.country.trim()}` : ""}`,
        registrationNumber: form.registrationNumber,
        taxId: form.taxId,
        hrName: form.hrName,
        hrEmail: form.hrEmail,
        hrPhone: form.hrPhone,
        hrTitle: form.hrTitle,
      };
      if (proofDocUrl) updatePayload.proofDocUrl = proofDocUrl;

      await apiAuthenticationServicePut(`/users/${user.id}`, updatePayload);

      // 3) Refresh auth context + navigate to pending approval.
      await refreshUser();
      navigate("/recruiter/pending");
    } catch (upErr: unknown) {
      const axiosErr = upErr as { response?: { data?: { data?: string; error?: string; message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.data ??
        axiosErr?.response?.data?.error ??
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        "Something went wrong while saving your organization. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!(form.companyName && form.industry);
      case 1: return !!(form.companyAddress && form.city && form.country);
      case 2: return !!(form.registrationNumber && form.proofFile);
      case 3: return !!(form.hrName && form.hrEmail);
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mx-auto">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Set Up Your Organization</h1>
          <p className="text-muted-foreground text-sm">
            Tell us about your company so our team can verify and approve your account.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block", i <= step ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-lg">{STEPS[step].label}</CardTitle>
            <CardDescription>
              {step === 0 && "Basic information about your company"}
              {step === 1 && "Where is your company located?"}
              {step === 2 && "Upload business registration documents for verification"}
              {step === 3 && "Who should we contact about this account?"}
              {step === 4 && "Review everything before submitting for approval"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 0: Company Information */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Company Name *</Label>
                    <Input placeholder="e.g. Acme Corporation" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Industry *</Label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField("industry", opt)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            form.industry === opt
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input placeholder="https://..." value={form.companyWebsite} onChange={(e) => updateField("companyWebsite", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Size</Label>
                    <div className="flex flex-wrap gap-2">
                      {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField("companySize", opt)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            form.companySize === opt
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Description</Label>
                  <Textarea rows={3} placeholder="What does your company do?" value={form.companyDescription} onChange={(e) => updateField("companyDescription", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 1: Company Location */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Street Address *</Label>
                    <Input placeholder="123 Main Street" value={form.companyAddress} onChange={(e) => updateField("companyAddress", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input placeholder="e.g. New York" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input placeholder="e.g. United States" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    This location is used to display your company address and determine where your internships are listed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Business Verification */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Business Verification</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload an official document (e.g. business registration certificate, license, or tax document) to verify your organization.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Registration Number *</Label>
                    <Input placeholder="e.g. 12345678" value={form.registrationNumber} onChange={(e) => updateField("registrationNumber", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID (optional)</Label>
                    <Input placeholder="e.g. 12-3456789" value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Upload Registration Document *</Label>
                  <label
                    htmlFor="proof-upload"
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all block",
                      form.proofFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    {form.proofFile ? (
                      <p className="text-sm font-medium break-all">{form.proofFileName}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to upload business registration document</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG — max 10MB</p>
                      </>
                    )}
                    <input id="proof-upload" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: HR/Contact Person */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input placeholder="e.g. Jane Smith" value={form.hrName} onChange={(e) => updateField("hrName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input placeholder="e.g. HR Manager" value={form.hrTitle} onChange={(e) => updateField("hrTitle", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Email *</Label>
                    <Input type="email" placeholder="jane@company.com" value={form.hrEmail} onChange={(e) => updateField("hrEmail", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" value={form.hrPhone} onChange={(e) => updateField("hrPhone", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Our admin team may reach out to this person if there are questions about your application.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Ready to submit</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      After submission, our admin team will review your application. You'll receive an email once approved.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReviewItem label="Company" value={form.companyName} />
                  <ReviewItem label="Industry" value={form.industry} />
                  <ReviewItem label="Website" value={form.companyWebsite || "—"} />
                  <ReviewItem label="Company Size" value={form.companySize || "—"} />
                  <ReviewItem label="Address" value={`${form.companyAddress}${form.city ? `, ${form.city}` : ""}${form.country ? `, ${form.country}` : ""}`} />
                  <ReviewItem label="Registration #" value={form.registrationNumber} />
                  <ReviewItem label="Tax ID" value={form.taxId || "—"} />
                  <ReviewItem label="Document" value={form.proofFileName || "Uploaded"} />
                  <ReviewItem label="HR Contact" value={form.hrName} />
                  <ReviewItem label="HR Email" value={form.hrEmail} />
                  <ReviewItem label="HR Title" value={form.hrTitle || "—"} />
                  <ReviewItem label="HR Phone" value={form.hrPhone || "—"} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canNext()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gradient-hero text-primary-foreground">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Submit for Approval
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

