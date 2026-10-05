import { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
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
  ArrowRight,
  Check,
  Sparkles,

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

const departmentCoordinatorSteps = [
  {
    number: "01",
    title: "Join the Department",
    description: "Set up your coordinator account and connect to the relevant department or faculty scope.",
  },
  {
    number: "02",
    title: "Track Students & Placements",
    description: "Monitor student activity, internship placements, and department-level engagement in one place.",
  },
  {
    number: "03",
    title: "Review Progress",
    description: "Approve updates, review reports, and ensure students stay on track throughout their internship journey.",
  },
];

const stats = [
  { value: "6", label: "connected platform roles" },
  { value: "1", label: "shared internship journey" },
  { value: "Live", label: "messages and progress updates" },
  { value: "End to end", label: "placement visibility" },
];

function HowItWorks() {
  const [activeTab, setActiveTab] = useState<
    "students" | "recruiters" | "department-coordinators"
  >("students");

  const steps =
    activeTab === "students"
      ? studentSteps
      : activeTab === "recruiters"
        ? recruiterSteps
        : departmentCoordinatorSteps;

  return (
    <section id="how-it-works" className="bg-[#f3f7fa] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008e9e]">A clear path forward</p>
          <h2 className="mt-3 text-3xl font-bold text-[#06234a] md:text-4xl">One journey, shared by everyone.</h2>
          <p className="mt-4 text-[#64748b]">From first application to final review, each person knows what comes next.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mt-10">
          <div role="tablist" aria-label="Choose a platform role" className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-[#dbe5ed] bg-white p-1.5 shadow-sm">
            <button
              role="tab"
              aria-selected={activeTab === "students"}
              onClick={() => setActiveTab("students")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "students"
                  ? "bg-[#06234a] text-white"
                  : "text-[#64748b] hover:text-[#06234a]"
              }`}
            >
              Students
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "recruiters"}
              onClick={() => setActiveTab("recruiters")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "recruiters"
                  ? "bg-[#06234a] text-white"
                  : "text-[#64748b] hover:text-[#06234a]"
              }`}
            >
              Recruiters
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "department-coordinators"}
              onClick={() => setActiveTab("department-coordinators")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "department-coordinators"
                  ? "bg-[#06234a] text-white"
                  : "text-[#64748b] hover:text-[#06234a]"
              }`}
            >
              Department Coordinators
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.45 }}
              whileHover={{ y: -5 }}
              className="group min-h-60 border-t-2 border-[#ccdce7] bg-white p-6 shadow-[0_12px_36px_rgba(6,35,74,0.04)] transition-colors hover:border-[#008e9e] md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008e9e]">Step {step.number}</span>
                <ArrowRight className="h-4 w-4 text-[#8090a1] transition-transform group-hover:translate-x-1 group-hover:text-[#008e9e]" />
              </div>

              <h3 className="mt-10 text-xl font-semibold text-[#06234a]">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#64748b]">
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex flex-col text-left">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f3f7fa]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] bg-[#e6f2f4] lg:block" />
        <div className="container relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative z-10 max-w-xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 border-b border-[#ccdce7] pb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#008e9e]">
              <Sparkles className="h-4 w-4" />
              A better start to working life
            </div>
            <h1 className="text-3xl font-display font-extrabold leading-[1.02] text-[#06234a] sm:text-5xl lg:text-7xl">
              <span className="block">Internship</span>
              <span className="block text-[#008e9e]">Connect</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#4b6176] md:text-xl">
              Make the move from classroom to career with a clearer, more connected internship journey.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-md bg-[#008e9e] px-6 text-base text-white hover:bg-[#00727e]">
                <Link to="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 rounded-md border-[#c7d6e1] bg-white/70 px-6 text-base text-[#06234a] hover:bg-white">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4b6176]">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#008e9e]" /> Verified organizations</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#008e9e]" /> Progress in one place</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-2xl lg:ml-auto"
          >
            <div className="overflow-hidden bg-[#dbeaf0] shadow-[0_20px_48px_rgba(6,35,74,0.14)]">
              <img
                src="https://images.pexels.com/photos/5940713/pexels-photo-5940713.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Two Black university students collaborating on a laptop with their instructor"
                className="aspect-[1.24/1] w-full object-cover object-center"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[#dbe5ed] bg-white">
        <div className="container mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-10">
          <div className="grid grid-cols-2 gap-y-7 md:grid-cols-4 md:divide-x md:divide-[#dbe5ed]">
            {stats.map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="px-3 text-center md:px-5">
                <div className="text-xl font-bold text-[#06234a] md:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-[#6b7b8e] sm:text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008e9e]">Built for the full journey</p>
              <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight text-[#06234a] md:text-4xl">More than a listing. A place to make progress.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#64748b]">Bring discovery, communication, and placement follow-through together for the people who make internships work.</p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="group border border-[#dbe5ed] bg-[#f8fafc] p-5 transition-colors hover:border-[#b2d7dc] md:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center bg-[#e1f2f4] text-[#007f8d] transition-colors group-hover:bg-[#06234a] group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-[#e5a72e]">0{index + 1}</span>
                </div>
                <h3 className="mt-8 font-semibold text-[#06234a]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#06234a] text-white">
        <div className="container mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e5a72e]">People make the placement</p>
            <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight md:text-4xl">Better handoffs. More room to grow.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 md:text-base">
              Students, company teams, and university coordinators each have a part to play. Keep the goals, updates, and next steps connected.
            </p>
            <div className="mt-7 space-y-3 text-sm text-white/85">
              <p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#e5a72e]" /> Clear ownership at each stage</p>
              <p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#e5a72e]" /> Feedback that stays with the student</p>
              <p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#e5a72e]" /> One place for tasks and conversations</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-[1.15fr_0.85fr] items-stretch gap-3 sm:gap-4">
            <motion.img
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1100"
              alt="Black women and colleagues working together around a conference table"
              loading="lazy"
              className="h-full min-h-64 w-full object-cover sm:min-h-80"
            />
            <motion.img
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              src="https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="A Black developer working at a laptop"
              loading="lazy"
              className="h-full min-h-64 w-full object-cover sm:min-h-80"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />
      <section className="bg-[#f3f7fa] py-20 md:py-24">
        <div className="container mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008e9e]">Trust by design</p>
            <h2 className="mt-3 text-3xl font-bold text-[#06234a] md:text-4xl">Every organization is verified.</h2>
            <p className="mt-4 text-[#64748b]">A thoughtful review process helps students approach opportunities with confidence.</p>
          </motion.div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: Building2, title: "Registered companies", description: "Organizations submit business details before posting opportunities." },
              { icon: FileCheck, title: "Document review", description: "Registration documents are reviewed before approval is granted." },
              { icon: ShieldCheck, title: "Safer opportunities", description: "Verification adds a layer of trust to the internship search." },
            ].map((item, index) => (
              <motion.article key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.09 }} className="flex gap-4 border-l-2 border-[#e5a72e] bg-white p-5 sm:p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#e1f2f4] text-[#007f8d]"><item.icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-semibold text-[#06234a]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </MotionConfig>
  );
}