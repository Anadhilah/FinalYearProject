import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {apiAuthenticationServiceGet} from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDashboardPath } from "@/lib/roleNavigation";
import {
  Briefcase,
  Users,
  Search,
  Shield,
  TrendingUp,
  ShieldCheck,
  FileCheck, 
  Building2,

} from "lucide-react";
interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isApproved: boolean;
}


const features = [
  {
    icon: Search,
    title: "Smart Search",
    description:
      "Find internships that match your skills, interests, and career goals with powerful filters.",
  },
  {
    icon: Users,
    title: "Direct Connect",
    description:
      "Connect directly with recruiters and get real-time updates on your applications.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description:
      "Monitor application status, manage deadlines, and stay organized throughout your search.",
  },
  {
    icon: Shield,
    title: "Verified Companies",
    description:
      "All companies are verified to ensure safe and legitimate internship opportunities.",
  },
];

const studentSteps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up, complete your profile, and upload your CV to get started.",
  },
  {
    number: "02",
    title: "Explore Opportunities",
    description:
      "Browse internships and volunteer positions from verified organizations.",
  },
  {
    number: "03",
    title: "Apply & Track Progress",
    description:
      "Submit applications and monitor their status from your dashboard.",
  },
];

const recruiterSteps = [
  {
    number: "01",
    title: "Register Organization",
    description: "Create an organization account and submit details.",
  },
  {
    number: "02",
    title: "Get Verified",
    description: "Upload business registration documents for admin review.",
  },
  {
    number: "03",
    title: "Post & Hire",
    description: "Publish opportunities and manage applicants easily.",
  },
];

const stats = [
  { value: "5,000+", label: "Internships Posted" },
  { value: "12,000+", label: "Students Registered" },
  { value: "800+", label: "Partner Companies" },
  { value: "95%", label: "Satisfaction Rate" },
];

function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"students" | "recruiters">(
    "students"
  );

  const steps =
    activeTab === "students" ? studentSteps : recruiterSteps;

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-slate-900">
            How InternshipConnect Works
          </h2>
          <p className="mt-4 text-slate-600">
            Connecting talented students with verified organizations.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mt-10">
          <div className="bg-white p-1 rounded-full shadow-md">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-6 py-2 rounded-full transition ${
                activeTab === "students"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600"
              }`}
            >
              Students
            </button>

            <button
              onClick={() => setActiveTab("recruiters")}
              className={`px-6 py-2 rounded-full transition ${
                activeTab === "recruiters"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600"
              }`}
            >
              Recruiters
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.2,
                duration: 0.5,
              }}
              whileHover={{
                y: -10,
                scale: 1.03,
              }}
              className="bg-white rounded-2xl p-8 shadow-md border"
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {step.number}
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                {step.title}
              </h3>

              <p className="mt-3 text-slate-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<User[]>([]);

  // If the user is already signed in, send them straight to their role dashboard.
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const FetchUsers = async () => {
  console.log("FetchUsers called"); 
  try {
    const response = await apiAuthenticationServiceGet("/pages/get-users");
    console.log("Raw response:", response); 
    setUserData(response.data ?? response);
    return response;
  } catch (error) {
    console.error("Error fetching users:", error); 
    return [];
  }
};
useEffect(() => {
  console.log("useEffect fired");
  FetchUsers();
}, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6 animate-fade-in">
              <Briefcase className="h-3.5 w-3.5" />
              Your Career Starts Here
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6 animate-fade-in">
              Connect With Your{" "}
              <span className="text-gradient">
                Dream Internship
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
              InternshipConnect bridges the gap between ambitious students and top companies.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="text-base px-8">
                <Link to="/register">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why InternshipConnect?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-card border"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />
            <section className="py-20 bg-white border-t">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Every Organization Is Verified
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Before posting any opportunity, organizations must complete a verification process using official business documents.
          </p>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Registered Companies</h3>
            <p className="text-sm text-muted-foreground">
              Only legally registered organizations can create accounts and post internships.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Document Review</h3>
            <p className="text-sm text-muted-foreground">
              Business registration documents are reviewed before approval is granted.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Safe Opportunities</h3>
            <p className="text-sm text-muted-foreground">
              Students can apply with confidence knowing every listing is verified.
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          This process helps eliminate fake listings and improves trust across the platform.
        </div>
      </div>
    </section>
     

      <Footer />
    </div>
  );
}