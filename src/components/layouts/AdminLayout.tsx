import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Shield, Building2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Manage Users", path: "/admin/users", icon: Users },
  { label: "Manage Recruiters", path: "/admin/recruiters", icon: Building2 },
  { label: "Manage Internships", path: "/admin/internships", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-foreground text-background flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-background/10">
          <img src={logo} alt="InternshipConnect" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-sm">Admin Panel</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-background/10 text-background font-medium" : "text-background/60 hover:bg-background/5 hover:text-background/80"
                )}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-background/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center text-xs font-medium text-destructive-foreground">{user?.name?.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-background">{user?.name}</p>
              <p className="text-xs text-background/50 truncate">Administrator</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-background/70 hover:text-background hover:bg-background/10" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 border-b bg-card sticky top-0 z-20">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <h1 className="font-display font-semibold text-lg">Admin Panel</h1>
        </header>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
