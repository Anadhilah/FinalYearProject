import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !allowedRoles.includes(user.role.toLowerCase() as UserRole)) return <Navigate to="/" replace />;

  // Additional check: recruiters must finish onboarding and be approved
  if (user.role === 'recruiter') {
    const status = user.recruiterStatus?.toLowerCase();
    const isApproved = user.isApproved === true || status === 'approved';

    // Not yet email-verified → send to verification.
    if (user.emailVerified === false) {
      return <Navigate to="/recruiter/verify-email" replace />;
    }

    // Verified but hasn't completed the onboarding wizard → send there.
    if (!isApproved && !user.company) {
      return <Navigate to="/recruiter/onboarding" replace />;
    }

    // Verified + onboarded but not approved yet → pending screen.
    if (!isApproved) {
      return <Navigate to="/recruiter/pending" replace />;
    }
  }

  return <>{children}</>;
}
