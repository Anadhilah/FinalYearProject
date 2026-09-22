import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Building2, FileText, Users, LogOut, Menu, X, BriefcaseBusiness, KeyRound } from "lucide-react";
import logo from "@/assets/logo.png";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Overview", path: "/faculty-coordinator", icon: LayoutDashboard },
  { label: "Departments", path: "/faculty-coordinator/departments", icon: Building2 },
  { label: "Reports", path: "/faculty-coordinator/reports", icon: FileText },
  { label: "Management", path: "/faculty-coordinator/management", icon: Users },
  { label: "Placements", path: "/faculty-coordinator/placements", icon: BriefcaseBusiness },
  { label: "Change password", path: "/change-password", icon: KeyRound },
];

export default function FacultyCoordinatorLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <img src={logo} alt="InternshipConnect" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-sm text-sidebar-primary-foreground">Faculty Portal</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path === "/faculty-coordinator" && location.pathname.startsWith("/faculty-coordinator"));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
          <LogoutButton variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </LogoutButton>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 border-b bg-card sticky top-0 z-20">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display font-semibold text-lg">Faculty Coordinator Dashboard</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
