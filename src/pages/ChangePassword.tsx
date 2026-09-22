import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getRoleDashboardPath } from "@/lib/roleNavigation";

export default function ChangePassword() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      const { error: profileError } = await supabase
        .from("User")
        .update({ mustChangePassword: false, updatedAt: new Date().toISOString() })
        .eq("id", user?.id || "");
      if (profileError) throw profileError;
      await refreshUser();
      toast({ title: "Password updated", description: "Your account is ready to use." });
      navigate(getRoleDashboardPath(user?.role), { replace: true });
    } catch (err) {
      setError((err as { message?: string })?.message || "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Create your password</CardTitle>
          <CardDescription>Your temporary password worked. Choose a private password before continuing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="new-password">New password</Label><div className="relative"><Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" required /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><div className="relative"><Input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="pr-10" required /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={saving}>{saving ? "Updating password..." : "Continue to dashboard"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
