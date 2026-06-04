import React from "react";
import { Flame, Hammer, Scissors, Wind, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { PrepJob, PrepStage } from "../../../types";
import { PREP_STAGES, STAGE_COLOR } from "../../../hooks/use-preparation";

interface PrepStatsBarProps {
  prepJobs: PrepJob[];
}

const STAGE_ICONS: Record<PrepStage, React.ElementType> = {
  Drying: Flame,
  Crushing: Hammer,
  Splitting: Scissors,
  Pulverizing: Wind,
};

export function PrepStatsBar({ prepJobs }: PrepStatsBarProps) {
  const total = prepJobs.length;
  const inProgress = prepJobs.filter((j) => j.overallStatus === "Active").length;
  const onHold = prepJobs.filter((j) => j.overallStatus === "On Hold").length;
  const completedToday = prepJobs.filter((j) => {
    if (j.overallStatus !== "Completed") return false;
    const last = j.steps.find((s) => s.stage === "Pulverizing");
    if (!last?.completedAt) return false;
    const d = new Date(last.completedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const avgDuration = (() => {
    const durations = prepJobs
      .flatMap((j) => j.steps)
      .filter((s) => s.status === "Completed" && s.durationMinutes != null)
      .map((s) => s.durationMinutes!);
    if (!durations.length) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  })();

  const stageCounts: Record<PrepStage, number> = {
    Drying: 0,
    Crushing: 0,
    Splitting: 0,
    Pulverizing: 0,
  };
  prepJobs
    .filter((j) => j.overallStatus === "Active")
    .forEach((j) => {
      stageCounts[j.currentStage] = (stageCounts[j.currentStage] || 0) + 1;
    });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {/* Summary cards */}
      <div className="col-span-2 sm:col-span-2 lg:col-span-2 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Loader2 className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{inProgress}</p>
          <p className="text-xs text-muted-foreground font-medium">Active Jobs</p>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-2 lg:col-span-2 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="size-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{completedToday}</p>
          <p className="text-xs text-muted-foreground font-medium">Completed Today</p>
        </div>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-2 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Clock className="size-5 text-amber-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {avgDuration != null ? `${avgDuration}m` : "—"}
          </p>
          <p className="text-xs text-muted-foreground font-medium">Avg Stage Time</p>
        </div>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-2 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
          <span className="text-rose-500 font-bold text-sm">{onHold}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground font-medium">Total · {onHold} on hold</p>
        </div>
      </div>

      {/* Stage breakdown */}
      {PREP_STAGES.map((stage) => {
        const Icon = STAGE_ICONS[stage];
        const count = stageCounts[stage];
        const color = STAGE_COLOR[stage];
        return (
          <div
            key={stage}
            className="col-span-1 sm:col-span-1 rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center gap-1"
            style={{ borderTopColor: color, borderTopWidth: 3 }}
          >
            <Icon className="size-4" style={{ color }} />
            <p className="text-xl font-bold text-foreground">{count}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              {stage}
            </p>
          </div>
        );
      })}
    </div>
  );
}
