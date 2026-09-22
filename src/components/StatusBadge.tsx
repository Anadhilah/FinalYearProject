import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "accepted" | "rejected" | "reviewing" | "department_review";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  accepted: { label: "Accepted", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  reviewing: { label: "Reviewing", className: "bg-primary/10 text-primary border-primary/20" },
  department_review: { label: "Awaiting department approval", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}
