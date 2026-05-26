import React from "react";
import { Flame, Hammer, Scissors, Wind, AlertCircle } from "lucide-react";
import { PrepJob, PrepStage } from "../../../types";
import { PREP_STAGES, STAGE_COLOR, UsePreparationReturn } from "../../../hooks/use-preparation";
import { StatusBadge } from "../../../components/lims/status-badge";

// ─── Stage Icon map ───────────────────────────────────────────────────────────

const STAGE_ICONS: Record<PrepStage, React.ElementType> = {
  Drying:      Flame,
  Crushing:    Hammer,
  Splitting:   Scissors,
  Pulverizing: Wind,
};

// ─── Single job card ─────────────────────────────────────────────────────────

interface PrepJobCardProps {
  job: PrepJob;
  onClick: () => void;
}

function PrepJobCard({ job, onClick }: PrepJobCardProps) {
  const currentStep = job.steps.find((s) => s.stage === job.currentStage);
  const completedCount = job.steps.filter((s) => s.status === "Completed").length;
  const progressPct = Math.round((completedCount / 4) * 100);
  const isHeld = job.overallStatus === "On Hold";
  const stageColor = STAGE_COLOR[job.currentStage];

  return (
    <li
      onClick={onClick}
      className={`group relative rounded-lg border bg-background overflow-hidden cursor-pointer transition-all hover:shadow-md select-none
        ${isHeld ? "border-rose-400/40 opacity-70" : "border-border hover:border-primary/40"}`}
    >
      {/* Stage color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: stageColor }} />

      <div className="p-3 space-y-2">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-primary">{job.sampleId}</span>
          <div className="flex items-center gap-1.5">
            {isHeld && <AlertCircle className="size-3.5 text-rose-500" />}
            <StatusBadge status={job.priority} />
          </div>
        </div>

        {/* Client / project */}
        <p className="text-sm font-semibold text-foreground leading-tight truncate">{job.client}</p>
        <p className="text-xs text-muted-foreground truncate">{job.project} · {job.sampleType}</p>

        {/* Technician + equipment */}
        {currentStep?.technicianName && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{currentStep.technicianName}</span>
            {currentStep.equipment && (
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {currentStep.equipment}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{completedCount}/4 stages</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: stageColor }}
            />
          </div>
        </div>

        {/* Stage dots */}
        <div className="flex gap-1 pt-0.5">
          {PREP_STAGES.map((stage) => {
            const step = job.steps.find((s) => s.stage === stage);
            const isDone = step?.status === "Completed";
            const isActive = step?.status === "In Progress";
            const color = STAGE_COLOR[stage];
            return (
              <div
                key={stage}
                className="flex-1 h-1 rounded-full transition-all"
                style={{
                  backgroundColor: isDone
                    ? color
                    : isActive
                    ? `${color}60`
                    : undefined,
                  background: !isDone && !isActive ? undefined : undefined,
                }}
                title={`${stage}: ${step?.status || "Queued"}`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: isDone ? color : isActive ? `${color}80` : "hsl(var(--muted))",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </li>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface PrepColumnProps {
  stage: PrepStage;
  jobs: PrepJob[];
  heldJobs: PrepJob[];
  onCardClick: (job: PrepJob) => void;
}

function PrepColumn({ stage, jobs, heldJobs, onCardClick }: PrepColumnProps) {
  const Icon = STAGE_ICONS[stage];
  const stageColor = STAGE_COLOR[stage];
  const allJobs = [...jobs, ...heldJobs.filter((j) => j.currentStage === stage)];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-border"
        style={{ borderTopColor: stageColor, borderTopWidth: 3 }}
      >
        <div
          className="size-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${stageColor}20` }}
        >
          <Icon className="size-4" style={{ color: stageColor }} />
        </div>
        <h3 className="text-sm font-semibold text-foreground flex-1">{stage}</h3>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
        >
          {allJobs.length}
        </span>
      </div>

      {/* Cards */}
      <ul className="flex-1 space-y-2 p-3 min-h-[300px] overflow-y-auto">
        {allJobs.length === 0 && (
          <li className="flex items-center justify-center h-24 text-xs text-muted-foreground italic">
            No samples in {stage}
          </li>
        )}
        {allJobs.map((job) => (
          <PrepJobCard key={job.id} job={job} onClick={() => onCardClick(job)} />
        ))}
      </ul>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

interface PrepKanbanProps {
  prepJobs: PrepJob[];
  onCardClick: (job: PrepJob) => void;
  actions: Pick<UsePreparationReturn, "startStep" | "completeStep" | "skipStep">;
}

export function PrepKanban({ prepJobs, onCardClick }: PrepKanbanProps) {
  const activeJobs = prepJobs.filter((j) => j.overallStatus === "Active");
  const heldJobs = prepJobs.filter((j) => j.overallStatus === "On Hold");

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {PREP_STAGES.map((stage) => (
        <PrepColumn
          key={stage}
          stage={stage}
          jobs={activeJobs.filter((j) => j.currentStage === stage)}
          heldJobs={heldJobs}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
