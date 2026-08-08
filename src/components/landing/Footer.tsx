import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-foreground text-background/70 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="InternshipConnect" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-display font-bold text-lg text-background">InternshipConnect</span>
            </div>
            <p className="text-sm max-w-sm">
              Bridging the gap between talented students and leading companies. Find your perfect internship or hire the next generation of talent.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-background mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-background transition-colors">Browse Internships</Link></li>
              <li><Link to="/register" className="hover:text-background transition-colors">For Recruiters</Link></li>
              <li><Link to="/login" className="hover:text-background transition-colors">Login</Link></li>
              <li><Link to="/install" className="hover:text-background transition-colors">Install App</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-background mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">About Us</span></li>
              <li><span className="cursor-default">Contact</span></li>
              <li><span className="cursor-default">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 mt-8 pt-6 text-center text-xs">
          &copy; {new Date().getFullYear()} InternshipConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
