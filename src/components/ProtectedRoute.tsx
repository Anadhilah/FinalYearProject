import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

function normalizeProtectedRole(role: string | null | undefined): UserRole {
  const normalized = (role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

  switch (normalized) {
    case "department-coordinator":
      return "department-coordinator";
    case "faculty-coordinator":
      return "faculty-coordinator";
    case "company-supervisor":
    case "company-internship-supervisor":
    case "supervisor":
      return "supervisor";
    default:
      return normalized as UserRole;
  }
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading your account…</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const normalizedUserRole = normalizeProtectedRole(user?.role);
  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeProtectedRole(role));

  if (!user || !normalizedAllowedRoles.includes(normalizedUserRole)) return <Navigate to="/" replace />;

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Additional check: recruiters must finish onboarding and be approved
  if (user.role === 'recruiter') {
    const status = user.recruiterStatus?.toLowerCase();
    const isApproved = user.isApproved === true || status === 'approved';

    // Recruiters must complete onboarding before approval.
    if (!isApproved && !user.company) {
      return <Navigate to="/recruiter/onboarding" replace />;
    }

    // Verified + onboarded but not approved yet → pending screen.
    if (!isApproved) {
      return <Navigate to="/recruiter/pending" replace />;
    }
  }

  if (user.role === 'department-coordinator') {
    const coordinatorStatus = (user.coordinatorStatus ?? 'PENDING').toUpperCase();
    if (coordinatorStatus === 'APPROVED' && location.pathname === '/department-coordinator/onboarding') {
      return <>{children}</>;
    }
    if (coordinatorStatus === 'APPROVED') {
      return <Navigate to="/department-coordinator/onboarding" replace />;
    }
    if (coordinatorStatus !== 'ACTIVE') {
      return <Navigate to="/" replace />;
    }
  }

  if (user.role === 'faculty-coordinator') {
    const coordinatorStatus = (user.coordinatorStatus ?? '').toUpperCase();
    if (coordinatorStatus !== 'ACTIVE' || user.isApproved !== true) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
