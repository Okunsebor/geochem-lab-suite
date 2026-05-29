import { cn } from "@/lib/utils";
import type { SampleStatus } from "../../types";

const styles: Record<string, string> = {
  // Sample lifecycle (existing labels)
  Received: "bg-blue-600/10 text-blue-300 border-blue-600/30",
  Verified: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "In Preparation": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "In Analysis": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Completed: "bg-mint/10 text-accent-mint border-mint/30",
  "Report Ready": "bg-mint/10 text-accent-mint border-mint/30",

  // Underscored aliases per design spec
  pending_verification: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  verified: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  registered: "bg-blue-600/10 text-blue-300 border-blue-600/30",
  in_preparation: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  in_analysis: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  completed: "bg-mint/10 text-accent-mint border-mint/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",

  // Instruments / operational
  Online: "bg-mint/10 text-accent-mint border-mint/30",
  Maintenance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Calibrating: "bg-accent-teal/10 text-accent-teal border-accent-teal/30",
  Active: "bg-mint/10 text-accent-mint border-mint/30",
  Invited: "bg-surface-elevated text-surface-muted border-surface-border",

  // Reports
  Draft: "bg-surface-elevated text-surface-muted border-surface-border",
  "Pending Approval": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Approved: "bg-mint/10 text-accent-mint border-mint/30",
  Delivered: "bg-accent-teal/10 text-accent-teal border-accent-teal/30",
  Revised: "bg-purple-500/10 text-purple-400 border-purple-500/30",

  // Priority
  Rush: "bg-red-500/10 text-red-400 border-red-500/30",
  High: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Normal: "bg-surface-elevated text-surface-muted border-surface-border",
  Low: "bg-surface-elevated text-surface-muted border-surface-border",
};

export function StatusBadge({ status, className }: { status: SampleStatus | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[status] || "bg-surface-elevated text-surface-muted border-surface-border",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
