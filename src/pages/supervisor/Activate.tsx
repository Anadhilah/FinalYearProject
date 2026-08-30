import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getSupervisorInvitation, activateSupervisorInvitation } from "@/services/supabase-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";

type InviteInfo = {
  valid: boolean;
  reason?: string;
  email?: string;
  name?: string;
  department?: string | null;
  university?: string | null;
};

export default function SupervisorActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInfo({ valid: false, reason: "invalid" });
      setLoading(false);
      return;
    }
    getSupervisorInvitation(token)
      .then((res) => {
        setInfo(res);
        if (res.valid) setName((res.name || "").trim());
      })
      .catch(() => setInfo({ valid: false, reason: "invalid" }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await activateSupervisorInvitation(token, name || info?.name || "", password);
      toast({ title: "Account activated!", description: `Welcome, supervisor. You can now log in with ${result.email}.` });
      navigate("/login", { replace: true });
    } catch (err) {
      toast({ title: "Activation failed", description: (err as { message?: string })?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Validating your invitation…</p>
      </div>
    );
  }

  if (!info?.valid) {
    const reasonText =
      info?.reason === "used"
        ? "This invitation has already been used."
        : info?.reason === "expired"
        ? "This invitation link has expired. Please ask the student to send a new one."
        : "This invitation link is invalid.";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <img src={logo} alt="InternshipConnect" className="h-16 w-16 object-contain mx-auto" />
          <h1 className="text-xl font-display font-bold">Invitation Unavailable</h1>
          <p className="text-sm text-muted-foreground">{reasonText}</p>
          <Link to="/login" className="text-primary text-sm font-medium hover:underline">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden rounded-2xl m-3 bg-muted">
        <img src={logo} alt="InternshipConnect" className="object-contain rounded-xl" style={{ width: "45%", maxWidth: "240px" }} />
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img src={logo} alt="InternshipConnect" className="h-16 w-16 object-contain mx-auto mb-8 md:hidden" />
          <h1 className="text-3xl font-display font-bold mb-1">Become a Supervisor</h1>
          <p className="text-muted-foreground text-sm mb-8">
            You have been invited to supervise students at {info.university || "your university"}.
            Create a password to activate your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={info.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Activating…" : "Activate Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
