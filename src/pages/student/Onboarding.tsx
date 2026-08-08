import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  User, GraduationCap, Wrench, Upload, CheckCircle,
  ArrowRight, ArrowLeft, Briefcase, X
} from "lucide-react";

const STEPS = [
  { label: "Role", icon: Briefcase },
  { label: "Personal", icon: User },
  { label: "Skills & Bio", icon: Wrench },
  { label: "CV Upload", icon: Upload },
  { label: "Review", icon: CheckCircle },
] as const;

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java",
  "SQL", "Git", "Docker", "AWS", "Figma", "UI/UX Design",
  "Data Analysis", "Machine Learning", "Communication", "Leadership",
] as const;

type Step = typeof STEPS[number]["label"];
type SkillOption = typeof SKILL_OPTIONS[number];

interface FormData {
  rolePreference: string;
  fullName: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  graduationYear: string;
  bio: string;
  skills: SkillOption[];
  cvFile: File | null;
}

interface Errors {
  [key: string]: string;
}

const MAX_BIO_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function StudentOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    rolePreference: "",
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    university: "",
    major: "",
    graduationYear: "",
    bio: "",
    skills: [],
    cvFile: null,
  });

  const [errors, setErrors] = useState<Errors>({});

  const progress = ((step + 1) / STEPS.length) * 100;

  // Auto-save draft
  useEffect(() => {
    const saved = localStorage.getItem("ic_onboarding_draft");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ic_onboarding_draft", JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleSkill = (skill: SkillOption) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Errors = {};

    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Valid email is required";
        }
        if (!formData.university.trim()) newErrors.university = "University is required";
        if (!formData.major.trim()) newErrors.major = "Major is required";
        break;

      case 2:
        if (formData.skills.length === 0) newErrors.skills = "Select at least one skill";
        if (formData.bio.length < 20) newErrors.bio = "Bio must be at least 20 characters";
        if (formData.bio.length > MAX_BIO_LENGTH) newErrors.bio = `Bio cannot exceed ${MAX_BIO_LENGTH} characters`;
        break;

      case 3:
        if (formData.cvFile && formData.cvFile.size > MAX_FILE_SIZE) {
          newErrors.cvFile = "File size must be less than 5MB";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }
    updateField("cvFile", file);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // TODO: Send data to backend here
      localStorage.setItem("ic_onboarded", "true");
      localStorage.removeItem("ic_onboarding_draft");

      toast({
        title: "Profile completed!",
        description: "Welcome to InternshipConnect",
      });
      navigate("/student");
    } catch {
      toast({
        title: "Failed to save profile",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!formData.rolePreference;
      case 1: return !!(formData.fullName && formData.email && formData.university && formData.major);
      case 2: return formData.skills.length > 0 && formData.bio.length > 10;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mx-auto">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm">Set up your profile to start applying for internships</p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  i <= step ? "text-foreground" : "text-muted-foreground"
                )}>
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
              {step === 0 && "What type of internship are you looking for?"}
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Highlight your skills and write a short bio"}
              {step === 3 && "Upload your CV/resume (optional but recommended)"}
              {step === 4 && "Review your information before completing setup"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Role Selection */}
            {step === 0 && (
              <div className="grid sm:grid-cols-3 gap-3">
                {["Engineering", "Design", "Business"].map((role) => (
                  <button
                    key={role}
                    onClick={() => updateField("rolePreference", role)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all hover:border-primary/50",
                      formData.rolePreference === role
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      {role === "Engineering" && <Wrench className="h-5 w-5 text-primary" />}
                      {role === "Design" && <GraduationCap className="h-5 w-5 text-primary" />}
                      {role === "Business" && <Briefcase className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="font-medium text-sm">{role}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role === "Engineering" && "Software, data, cloud"}
                      {role === "Design" && "UI/UX, graphic, product"}
                      {role === "Business" && "Marketing, finance, ops"}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>University *</Label>
                  <Input
                    placeholder="e.g. MIT"
                    value={formData.university}
                    onChange={(e) => updateField("university", e.target.value)}
                    className={errors.university ? "border-destructive" : ""}
                  />
                  {errors.university && <p className="text-xs text-destructive">{errors.university}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Major *</Label>
                  <Input
                    placeholder="e.g. Computer Science"
                    value={formData.major}
                    onChange={(e) => updateField("major", e.target.value)}
                    className={errors.major ? "border-destructive" : ""}
                  />
                  {errors.major && <p className="text-xs text-destructive">{errors.major}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Expected Graduation</Label>
                  <Input
                    placeholder="e.g. 2027"
                    value={formData.graduationYear}
                    onChange={(e) => updateField("graduationYear", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Skills & Bio */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Select Your Skills *</Label>
                  {errors.skills && <p className="text-xs text-destructive">{errors.skills}</p>}
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          formData.skills.includes(skill)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {skill}
                        {formData.skills.includes(skill) && <X className="inline h-3 w-3 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Bio * <span className="text-muted-foreground">({formData.bio.length}/{MAX_BIO_LENGTH})</span>
                  </Label>
                  <Textarea
                    rows={4}
                    maxLength={MAX_BIO_LENGTH}
                    placeholder="Tell recruiters about yourself, your goals, and what you're looking for..."
                    value={formData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    className={errors.bio ? "border-destructive" : ""}
                  />
                  {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
                </div>
              </div>
            )}

            {/* Step 3: CV Upload */}
            {step === 3 && (
              <div className="space-y-4">
                <label
                  htmlFor="cv-upload"
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    formData.cvFile
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  {formData.cvFile ? (
                    <>
                      <p className="font-medium text-sm">{formData.cvFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX — max 5MB</p>
                    </>
                  )}
                  <input
                    id="cv-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {formData.cvFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => updateField("cvFile", null)}
                  >
                    Remove file
                  </Button>
                )}
                {errors.cvFile && <p className="text-xs text-destructive">{errors.cvFile}</p>}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReviewItem label="Role Preference" value={formData.rolePreference} />
                  <ReviewItem label="Full Name" value={formData.fullName} />
                  <ReviewItem label="Email" value={formData.email} />
                  <ReviewItem label="Phone" value={formData.phone || "—"} />
                  <ReviewItem label="University" value={formData.university} />
                  <ReviewItem label="Major" value={formData.major} />
                  <ReviewItem label="Graduation" value={formData.graduationYear || "—"} />
                  <ReviewItem label="CV" value={formData.cvFile ? formData.cvFile.name : "Not uploaded"} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed">{formData.bio}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canNext()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="gradient-hero text-primary-foreground"
            >
              {isSubmitting ? "Saving..." : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Complete Setup
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
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}