import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label, value, delta, trend = "up", icon, hint,
}: {
  label: string; value: ReactNode; delta?: string;
  trend?: "up" | "down"; icon?: ReactNode; hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta && (
          <span className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
            trend === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}>
            {trend === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
