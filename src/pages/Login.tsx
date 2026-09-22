import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { getRoleDashboardPath } from "@/lib/roleNavigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      toast({ title: "Login successful", description: "You have been logged in.", variant: "default" });
      navigate(loggedInUser.mustChangePassword ? "/change-password" : getRoleDashboardPath(loggedInUser.role), { replace: true });
    } catch (error: unknown) {
      console.log(error);
      toast({ title: "Login failed", description: "Invalid credentials. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes logo-breathe {
          0%   { transform: scale(1);     filter: drop-shadow(0 8px 24px hsl(var(--primary) / 0.30)); }
          50%  { transform: scale(1.04);  filter: drop-shadow(0 16px 48px hsl(var(--primary) / 0.55)); }
          100% { transform: scale(1);     filter: drop-shadow(0 8px 24px hsl(var(--primary) / 0.30)); }
        }
        @keyframes ring-pulse {
          0%   { transform: scale(0.88); opacity: 0.5; }
          60%  { transform: scale(1.18); opacity: 0;   }
          100% { transform: scale(1.18); opacity: 0;   }
        }
        @keyframes ring-pulse-2 {
          0%   { transform: scale(0.88); opacity: 0.3; }
          60%  { transform: scale(1.28); opacity: 0;   }
          100% { transform: scale(1.28); opacity: 0;   }
        }
        .logo-breathe {
          animation: logo-breathe 4s ease-in-out infinite;
        }
        .ring-1 {
          animation: ring-pulse 4s ease-out infinite;
        }
        .ring-2 {
          animation: ring-pulse-2 4s ease-out 0.9s infinite;
        }
      `}</style>

      <div className="min-h-screen flex bg-background">

        {/* ── Left panel: logo ── */}
        <div className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden rounded-2xl m-3 bg-muted">

          {/* Soft radial glow using primary color */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
            }}
          />

          {/* Subtle border grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="ring-1 rounded-full border"
              style={{
                width: "52%",
                paddingBottom: "52%",
                borderColor: "hsl(var(--primary) / 0.35)",
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="ring-2 rounded-full border"
              style={{
                width: "52%",
                paddingBottom: "52%",
                borderColor: "hsl(var(--primary) / 0.20)",
              }}
            />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center gap-5">
            <img
              src={logo}
              alt="InternshipConnect"
              className="logo-breathe object-contain rounded-xl"
              style={{ width: "50%", maxWidth: "260px", height: "auto" }}
            />
            <p
              className="text-xs tracking-[0.25em] uppercase font-semibold"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              InternshipConnect
            </p>
          </div>

          {/* Bottom tagline */}
          <div className="absolute bottom-10 left-0 right-0 text-center z-10 px-8">
            <p className="text-foreground/80 text-xl font-semibold leading-snug">
              Launch Your Career,
            </p>
            <p className="text-muted-foreground text-xl">Find Your Future</p>
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* Mobile-only logo */}
            <div className="flex justify-center mb-8 md:hidden">
              <img src={logo} alt="InternshipConnect" className="h-16 w-16 object-contain" />
            </div>

            <h1 className="text-foreground text-3xl font-bold mb-1">Welcome Back</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline transition-colors">
                Register
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            {/* <div className="mt-6 p-3 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Demo accounts:</p>
              <p>Student: student@test.com</p>
              <p>Recruiter: recruiter@test.com</p>
              <p>Admin: admin@test.com</p>
              <p>Password: password</p>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}