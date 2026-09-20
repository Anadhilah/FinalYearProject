import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"student" | "recruiter" | "department-coordinator">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coordinator, setCoordinator] = useState({
    phoneNumber: "",
    institutionName: "",
    facultyName: "",
    departmentName: "",
    positionTitle: "",
    coordinatorResponsibility: "",
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateCoordinator = (field: keyof typeof coordinator, value: string) => {
    setCoordinator((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (role === "department-coordinator" && Object.values(coordinator).some((value) => !value.trim())) {
      setError("Please complete all Department Coordinator fields.");
      return;
    }

    setLoading(true);
    try {
      const newUser = await register(name, email, password, role, {
        coordinatorStatus: role === "department-coordinator" ? "PENDING" : undefined,
        ...coordinator,
      });
      if (role === "recruiter") {
        navigate("/recruiter/verify-email");
      } else if (role === "department-coordinator") {
        navigate("/login");
      } else {
        navigate("/student/onboarding");
      }
      return newUser;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; data?: string; message?: string } }; message?: string };
      setError(
        axiosErr?.response?.data?.error ??
        axiosErr?.response?.data?.data ??
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-6">
      <Card className="w-full max-w-5xl shadow-elevated">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-2">
           <img
              src={logo} alt="InternshipConnect" className="h-20 w-20 rounded-lg object-contain"/>
           </Link>
          <CardTitle className="font-display text-2xl">Create Account</CardTitle>
          <CardDescription>Join InternshipConnect today</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-4">
          <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "recruiter" | "department-coordinator")}>
            <TabsList className="grid h-auto grid-cols-1 gap-1 w-full">
              <TabsTrigger value="student" className="flex-1">Student</TabsTrigger>
              <TabsTrigger value="recruiter" className="flex-1">Recruiter</TabsTrigger>
              <TabsTrigger value="department-coordinator" className="flex-1">Department Coordinator</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="mb-4 text-center text-xs text-muted-foreground">
            Student and Recruiter accounts can register directly. Department Coordinators are
            submitted for review before activation.
          </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            </div>

            {role === "department-coordinator" && (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-semibold">Department Coordinator information</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="coord-phone">Phone Number</Label><Input id="coord-phone" value={coordinator.phoneNumber} onChange={(e) => updateCoordinator("phoneNumber", e.target.value)} required /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="coord-institution">University</Label><Input id="coord-institution" placeholder="Enter your university" value={coordinator.institutionName} onChange={(e) => updateCoordinator("institutionName", e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="coord-faculty">Faculty / School</Label><Input id="coord-faculty" placeholder="Enter faculty or school" value={coordinator.facultyName} onChange={(e) => updateCoordinator("facultyName", e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="coord-department">Department</Label><Input id="coord-department" placeholder="Enter department" value={coordinator.departmentName} onChange={(e) => updateCoordinator("departmentName", e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="coord-position">Position / Title</Label><Input id="coord-position" value={coordinator.positionTitle} onChange={(e) => updateCoordinator("positionTitle", e.target.value)} required /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="coord-responsibility">Internship Coordinator Responsibility</Label><Input id="coord-responsibility" value={coordinator.coordinatorResponsibility} onChange={(e) => updateCoordinator("coordinatorResponsibility", e.target.value)} placeholder="Describe your responsibility" required /></div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input 
                  id="reg-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5 16.477 5 20.268 7.943 21.542 12 20.268 16.057 16.477 19 12 19 7.523 19 3.732 16.057 2.458 12z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908l3.42 3.42M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5 16.477 5 20.268 7.943 21.542 12 20.268 16.057 16.477 19 12 19 7.523 19 3.732 16.057 2.458 12z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908l3.42 3.42M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Creating Account…"
                : `Register as ${role === "student" ? "Student" : role === "recruiter" ? "Recruiter" : "Department Coordinator"}`}
            </Button>
          </form>

         
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}