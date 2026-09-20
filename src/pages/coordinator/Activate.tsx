import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCoordinatorInvitation, activateCoordinatorInvitation } from "@/services/supabase-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

type InviteInfo = {
  valid: boolean;
  reason?: string;
  email?: string;
  name?: string;
};

export default function CoordinatorActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInfo({ valid: false, reason: "invalid" });
      setLoading(false);
      return;
    }

    getCoordinatorInvitation(token)
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
      const result = await activateCoordinatorInvitation(token, name || info?.name || "", password);
      toast({ title: "Account activated!", description: `Welcome, Department Coordinator. You can now log in with ${result.email}.` });
      navigate("/login", { replace: true });
    } catch (err) {
      toast({
        title: "Activation failed",
        description: (err as { message?: string })?.message || "Please try again.",
        variant: "destructive",
      });
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
          ? "This invitation link has expired. Please ask the admin to send a new one."
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
          <h1 className="text-3xl font-display font-bold mb-1">Activate Department Coordinator Account</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Complete your account setup to become a Department Coordinator in InternshipConnect.
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
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
