import { cn } from "@/lib/utils";
import type { SampleStatus } from "@/lib/mock-data";

const styles: Record<string, string> = {
  Received: "bg-muted text-muted-foreground border-border",
  Verified: "bg-info/10 text-info border-info/30",
  "In Preparation": "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  "In Analysis": "bg-primary/10 text-primary border-primary/30",
  Completed: "bg-success/15 text-success border-success/30",
  "Report Ready": "bg-gradient-to-r from-primary/15 to-success/15 text-primary border-primary/40",
  Online: "bg-success/15 text-success border-success/30",
  Maintenance: "bg-warning/15 text-warning border-warning/30",
  Calibrating: "bg-info/10 text-info border-info/30",
  Active: "bg-success/15 text-success border-success/30",
  Invited: "bg-muted text-muted-foreground border-border",
  Draft: "bg-muted text-muted-foreground border-border",
  "Pending Approval": "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-success/15 text-success border-success/30",
  Delivered: "bg-info/10 text-info border-info/30",
  Revised: "bg-accent text-accent-foreground border-border",
  Rush: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/15 text-warning border-warning/30",
  Normal: "bg-muted text-muted-foreground border-border",
  Low: "bg-secondary text-secondary-foreground border-border",
};

export function StatusBadge({ status, className }: { status: SampleStatus | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[status] || "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
