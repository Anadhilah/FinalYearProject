
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "recruiter") {
      navigate("/");
      return;
    }
  }, [navigate, user]);

  useEffect(() => {
    const checkApproval = async () => {
      try {
        await refreshUser();
        const storedUser = JSON.parse(localStorage.getItem("ic_user") || "null");
        if (!storedUser) return;

        const s = storedUser.recruiterStatus?.toLowerCase?.() ?? (storedUser.isApproved ? "approved" : "pending");
        setStatus(s);

        if (s === "approved") {
          navigate("/recruiter/");
        }
        if (s === "rejected") {
          return;
        }
        if (s === "pending" && !storedUser.company && storedUser.emailVerified) {
          navigate("/recruiter/onboarding");
        }
      } catch {
        // ignore transient errors
      }
    };

    checkApproval();
    const intervalId = window.setInterval(checkApproval, 3000);
    return () => window.clearInterval(intervalId);
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-elevated text-center">
        <CardContent className="p-8 space-y-6">
          <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold">
              {status === "rejected" ? "Application Not Approved" : "Account Pending Approval"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {status === "rejected"
                ? "Your organization registration was not approved. Please contact support for more details."
                : "Your recruiter account has been submitted for verification. Our admin team will review your business registration details and approve your account shortly."}
            </p>
          </div>
          <div className="space-y-3 text-sm text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Verification in Progress</p>
                <p className="text-xs text-muted-foreground">Business documents are being reviewed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Email Notification</p>
                <p className="text-xs text-muted-foreground">You'll receive an email once approved</p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
