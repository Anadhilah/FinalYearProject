import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, PlusCircle, Users, MessageCircle, Video, GraduationCap, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ic_recruiter_walkthrough_done";

interface Step {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Your overview",
    description:
      "This is your recruiter dashboard. Track active postings, applicants, views, and hires at a glance.",
  },
  {
    icon: PlusCircle,
    title: "Post internships",
    description:
      "Use Post Internship to create new listings. Your organization is verified, so you can publish right away.",
  },
  {
    icon: Users,
    title: "Review applicants",
    description:
      "Open Applicants to review applications, shortlist candidates, and manage your hiring pipeline.",
  },
  {
    icon: MessageCircle,
    title: "Chat with students",
    description:
      "Use Messages to answer student questions and discuss roles before scheduling interviews.",
  },
  {
    icon: Video,
    title: "Hold meetings",
    description:
      "Schedule video meetings directly from your dashboard to interview shortlisted candidates.",
  },
];

export function isWalkthroughPending(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== "done";
}

export function markWalkthroughDone(): void {
  localStorage.setItem(STORAGE_KEY, "done");
}

export default function FirstTimeWalkthrough() {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);

  const handleClose = () => {
    markWalkthroughDone();
    setOpen(false);
  };

  const handleNext = () => {
    if (index >= STEPS.length - 1) {
      handleClose();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const step = STEPS[index];

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleClose();
      else setOpen(o);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Badge variant="outline" className="w-fit text-xs mb-2 bg-primary/5 border-primary/20 text-primary">
            <GraduationCap className="h-3.5 w-3.5 mr-1" />
            {index + 1} of {STEPS.length}
          </Badge>
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 mb-3"
          )}>
            <step.icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="leading-relaxed">{step.description}</DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              )}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {index > 0 && (
            <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} className="gradient-hero text-primary-foreground">
            {index >= STEPS.length - 1 ? (
              <>
                <X className="h-4 w-4 mr-1" /> Get Started
              </>
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

