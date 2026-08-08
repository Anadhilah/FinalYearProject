import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ShieldCheck, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const email = user?.email ?? "";

  useEffect(() => {
    if (!user) {
      navigate("/register");
      return;
    }
    if (user.role !== "recruiter") {
      navigate("/");
      return;
    }
    if (user.emailVerified) {
      navigate(user.company ? "/recruiter/pending" : "/recruiter/onboarding");
    }
  }, [user, navigate]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await refreshUser();
      if (user?.emailVerified) {
        navigate(user.company ? "/recruiter/pending" : "/recruiter/onboarding");
        return;
      }
      setInfo(
        "Still waiting for your email confirmation. Open the verification email, click the confirmation link, then press refresh."
      );
    } catch (err) {
      console.error("Email verification refresh failed:", err);
      setError("Unable to refresh your verification status right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      setInfo("A new confirmation link has been sent to your email.");
    } catch (err) {
      console.error("Resend confirmation email failed:", err);
      setError("Could not send a new confirmation link. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mx-auto">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to <span className="font-medium text-foreground">{email || "your email"}</span>.
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Email Confirmation Required</CardTitle>
            <CardDescription>
              Click the link in your inbox to confirm your email and continue setting up your recruiter account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                {info}
              </div>
            )}

            <div className="space-y-4">
              <Button type="button" className="w-full" onClick={handleRefresh} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Refresh status
                  </>
                ) : (
                  "I confirmed my email"
                )}
              </Button>

              <Button type="button" variant="secondary" className="w-full" onClick={handleResend} disabled={loading}>
                Resend confirmation email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Why verify?</p>
            <p className="text-xs text-muted-foreground">
              Confirming your email helps us protect your recruiter account and allows us to approve your organization.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Wrong email? <Link to="/register" className="text-primary font-medium hover:underline">Register again</Link>
        </p>
      </div>
    </div>
  );
}

