import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { activateDepartmentCoordinator } from "@/services/supabase-api";

export default function DepartmentCoordinatorOnboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [positionTitle, setPositionTitle] = useState(user?.positionTitle || "");
  const [responsibility, setResponsibility] = useState(user?.coordinatorResponsibility || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!positionTitle.trim() || !responsibility.trim()) {
      setError("Please complete all onboarding fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await activateDepartmentCoordinator(positionTitle.trim(), responsibility.trim());
      await refreshUser();
      navigate("/department-coordinator", { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg shadow-elevated">
        <CardHeader>
          <CardTitle>Department Coordinator Onboarding</CardTitle>
          <CardDescription>Your request was approved. Complete this step to activate your coordinator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2"><Label>Full Name</Label><Input value={user?.name || ""} disabled /></div>
            <div className="space-y-2"><Label>University Email</Label><Input value={user?.email || ""} disabled /></div>
            <div className="space-y-2"><Label htmlFor="position-title">Position / Title</Label><Input id="position-title" value={positionTitle} onChange={(event) => setPositionTitle(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="responsibility">Internship Coordinator Responsibility</Label><Input id="responsibility" value={responsibility} onChange={(event) => setResponsibility(event.target.value)} required /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading}>{loading ? "Activating account…" : "Complete onboarding"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
