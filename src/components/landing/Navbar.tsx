import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user?.role === "student" ? "/student" : user?.role === "recruiter" ? "/recruiter" : "/admin";

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="InternshipConnect" className="h-12 w-12 rounded-lg object-contain" />
          <span className="font-display font-bold text-lg">InternshipConnect</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPath}>Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              {/* <Button variant="ghost" size="sm" asChild>
                <Link to="/install">Install App</Link>
              </Button> */}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              {/* <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button> */}
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-2 animate-fade-in">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => { logout(); setMobileOpen(false); }}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link to="/install" onClick={() => setMobileOpen(false)}>Install App</Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
              </Button>
              <Button size="sm" className="w-full" asChild>
                <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
