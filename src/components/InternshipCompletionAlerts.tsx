import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchInternshipCompletionWorkflows, type InternshipCompletionWorkflow } from "@/services/supabase-api";

function getNotice(workflow: InternshipCompletionWorkflow, userId: string, role: string): { title: string; description: string } | null {
  if (workflow.status === "END_DATE_REACHED" && (workflow.studentId === userId || workflow.companySupervisorId === userId)) {
    return { title: "Internship period ended", description: `${workflow.internshipTitle} has reached its end date. Open Internship Completion to review the next step.` };
  }
  if (workflow.status === "EXTENSION_REQUESTED" && workflow.studentId === userId) {
    return { title: "Extension request received", description: `${workflow.companySupervisorName || "Your company supervisor"} requested an extension for ${workflow.internshipTitle}.` };
  }
  if (workflow.status === "REPORT_DUE" && workflow.companySupervisorId === userId) {
    if (workflow.earlyEndReason) {
      return { title: "Early end recorded", description: `Submit the final report for ${workflow.internshipTitle}.` };
    }
    const declined = workflow.extensionDecision === "DECLINED";
    return { title: declined ? "Extension declined" : "Final report due", description: declined ? `The student declined the extension for ${workflow.internshipTitle}. Submit the final report.` : `Submit the final report for ${workflow.internshipTitle}.` };
  }
  if (workflow.status === "REPORT_DUE" && workflow.studentId === userId && workflow.earlyEndReason) {
    return { title: "Internship ended early", description: `Your company supervisor ended ${workflow.internshipTitle} early. Review the reason and final report.` };
  }
  if (workflow.status === "ACTIVE" && workflow.extensionDecision === "ACCEPTED" && (workflow.studentId === userId || workflow.companySupervisorId === userId)) {
    return { title: "Extension accepted", description: `${workflow.internshipTitle} will continue until ${workflow.currentEndDate}.` };
  }
  if (workflow.status === "REPORT_SUBMITTED" && workflow.studentId === userId && !workflow.studentAcknowledgedAt) {
    return { title: "Final report ready", description: `Read and acknowledge the final report for ${workflow.internshipTitle}.` };
  }
  if (workflow.status === "REPORT_SUBMITTED" && workflow.facultyCoordinatorId === userId && workflow.studentAcknowledgedAt) {
    return { title: "Final report awaiting review", description: `${workflow.studentName} acknowledged the report for ${workflow.internshipTitle}.` };
  }
  if (workflow.status === "CLARIFICATION_REQUESTED" && workflow.companySupervisorId === userId) {
    return { title: "Report clarification requested", description: `Update the final report for ${workflow.internshipTitle}.` };
  }
  if (role === "department-coordinator" && workflow.departmentCoordinatorId === userId && workflow.status === "COMPLETED") {
    return { title: "Placement completed", description: `${workflow.studentName}'s internship at ${workflow.companyName} is complete.` };
  }
  if (workflow.status === "COMPLETED" && workflow.studentId === userId) {
    return { title: "Internship completed", description: `${workflow.internshipTitle} has been approved and added to your history.` };
  }
  return null;
}

export function InternshipCompletionAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const notified = useRef(new Set<string>());
  const role = String(user?.role || "").toLowerCase().replace(/_/g, "-");

  useEffect(() => {
    if (!user?.id) return;

    const check = async () => {
      try {
        const workflows = await fetchInternshipCompletionWorkflows();
        workflows.forEach((workflow) => {
          const notice = getNotice(workflow, user.id, role);
          if (!notice) return;
          const key = [workflow.id, workflow.status, workflow.extensionDecision, workflow.studentAcknowledgedAt, workflow.completedAt].join(":");
          if (notified.current.has(key)) return;
          notified.current.add(key);
          toast(notice);
        });
      } catch {
        // Completion migrations may not yet be installed in the connected project.
      }
    };

    void check();
    const interval = setInterval(() => void check(), 30000);
    return () => clearInterval(interval);
  }, [role, toast, user?.id]);

  return null;
}