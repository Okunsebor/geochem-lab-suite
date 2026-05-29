import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  SkipForward,
  Play,
  Clock,
  User,
  Wrench,
  Pause,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { PrepJob, PrepStep, PrepStage, PrepStepStatus } from "../../../types";
import {
  PREP_STAGES,
  STAGE_EQUIPMENT,
  STAGE_COLOR,
  UsePreparationReturn,
} from "../../../hooks/use-preparation";
import { StatusBadge } from "../../../components/shared/StatusBadge";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(mins?: number) {
  if (mins == null) return "—";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatTimestamp(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<PrepStepStatus, { label: string; color: string; bg: string }> = {
  "Queued":      { label: "Queued",      color: "text-muted-foreground", bg: "bg-muted" },
  "In Progress": { label: "In Progress", color: "text-amber-600",        bg: "bg-amber-500/10" },
  "Completed":   { label: "Completed",   color: "text-emerald-600",      bg: "bg-emerald-500/10" },
  "Skipped":     { label: "Skipped",     color: "text-muted-foreground", bg: "bg-muted" },
};

// ─── Step Row ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: PrepStep;
  isCurrentStage: boolean;
  onStart: (technician: string, equipment?: string) => void;
  onComplete: (notes?: string) => void;
  onSkip: (reason?: string) => void;
}

function StepRow({ step, isCurrentStage, onStart, onComplete, onSkip }: StepRowProps) {
  const [techInput, setTechInput] = useState(step.technicianName || "");
  const [eqInput, setEqInput] = useState(step.equipment || STAGE_EQUIPMENT[step.stage][0]);
  const [notesInput, setNotesInput] = useState("");
  const [expanded, setExpanded] = useState(step.status === "In Progress" || isCurrentStage);

  const meta = STATUS_META[step.status];
  const stageColor = STAGE_COLOR[step.stage];

  return (
    <div
      className="rounded-lg border border-border overflow-hidden transition-all"
      style={{ borderLeftColor: stageColor, borderLeftWidth: 3 }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <span
          className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
        >
          {PREP_STAGES.indexOf(step.stage) + 1}
        </span>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{step.stage}</span>

        {step.technicianName && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3" /> {step.technicianName}
          </span>
        )}
        {step.equipment && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wrench className="size-3" /> {step.equipment}
          </span>
        )}
        {step.startedAt && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> {formatTimestamp(step.startedAt)}
          </span>
        )}
        {step.durationMinutes != null && (
          <span className="text-xs text-muted-foreground">{formatDuration(step.durationMinutes)}</span>
        )}

        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <ChevronRight
          className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded controls */}
      {expanded && step.status !== "Completed" && step.status !== "Skipped" && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/10">
          {step.status === "Queued" && (
            <>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Technician
                  </label>
                  <input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="Technician name"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Equipment
                  </label>
                  <select
                    value={eqInput}
                    onChange={(e) => setEqInput(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {STAGE_EQUIPMENT[step.stage].map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onStart(techInput || "Unassigned", eqInput)}
                  className="flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold hover:opacity-90 transition"
                >
                  <Play className="size-3" /> Start Stage
                </button>
                <button
                  onClick={() => onSkip(`Skipped: ${step.stage}`)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground font-semibold hover:text-foreground transition"
                >
                  <SkipForward className="size-3" /> Skip
                </button>
              </div>
            </>
          )}

          {step.status === "In Progress" && (
            <>
              <div className="pt-3 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Completion Notes (optional)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Any observations or anomalies..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onComplete(notesInput || undefined)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs text-white font-semibold transition"
                >
                  <CheckCircle2 className="size-3" /> Complete Stage
                </button>
                <button
                  onClick={() => onSkip("Skipped during in-progress stage")}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground font-semibold hover:text-foreground transition"
                >
                  <SkipForward className="size-3" /> Skip
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Completed / Skipped summary */}
      {expanded && (step.status === "Completed" || step.status === "Skipped") && step.notes && (
        <div className="px-4 pb-3 pt-2 border-t border-border bg-muted/10">
          <p className="text-xs text-muted-foreground italic">"{step.notes}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface PrepJobModalProps {
  job: PrepJob;
  onClose: () => void;
  actions: Pick<UsePreparationReturn, "startStep" | "completeStep" | "skipStep" | "holdJob" | "resumeJob">;
}

export function PrepJobModal({ job, onClose, actions }: PrepJobModalProps) {
  const stepsMap = new Map(job.steps.map((s) => [s.stage, s]));

  const completedCount = job.steps.filter((s) => s.status === "Completed").length;
  const totalSteps = PREP_STAGES.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 sticky top-0 bg-card z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-primary">{job.sampleId}</span>
              <StatusBadge status={job.priority} />
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  job.overallStatus === "Active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : job.overallStatus === "On Hold"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {job.overallStatus}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-foreground">{job.client}</p>
            <p className="text-xs text-muted-foreground">{job.project} · {job.sampleType}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-bold text-foreground">{completedCount}/{totalSteps} stages</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Stage dots */}
          <div className="mt-3 flex items-center gap-1.5">
            {PREP_STAGES.map((stage) => {
              const s = stepsMap.get(stage);
              const color = STAGE_COLOR[stage];
              const isDone = s?.status === "Completed";
              const isActive = s?.status === "In Progress";
              const isSkipped = s?.status === "Skipped";
              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: isDone || isActive ? `${color}30` : undefined,
                        border: `2px solid ${isDone || isActive ? color : "hsl(var(--border))"}`,
                        color: isDone || isActive ? color : "hsl(var(--muted-foreground))",
                        opacity: isSkipped ? 0.4 : 1,
                      }}
                    >
                      {isDone ? "✓" : PREP_STAGES.indexOf(stage) + 1}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{stage}</span>
                  </div>
                  {PREP_STAGES.indexOf(stage) < PREP_STAGES.length - 1 && (
                    <div className="h-px flex-1 bg-border mb-4" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step controls */}
        <div className="px-6 py-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Stage Controls</h4>
          {PREP_STAGES.map((stage) => {
            const step = stepsMap.get(stage) ?? {
              id: `${job.id}-${stage}`,
              jobId: job.id,
              sampleId: job.sampleId,
              stage,
              status: "Queued" as const,
              technicianName: "",
            };
            return (
              <StepRow
                key={stage}
                step={step}
                isCurrentStage={job.currentStage === stage}
                onStart={(tech, eq) => actions.startStep(job.id, stage, tech, eq)}
                onComplete={(notes) => actions.completeStep(job.id, stage, notes)}
                onSkip={(reason) => actions.skipStep(job.id, stage, reason)}
              />
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border px-6 py-4 bg-muted/10">
          {job.overallStatus === "Active" && (
            <button
              onClick={() => { actions.holdJob(job.id); onClose(); }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Pause className="size-3" /> Put On Hold
            </button>
          )}
          {job.overallStatus === "On Hold" && (
            <button
              onClick={() => { actions.resumeJob(job.id); onClose(); }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
            >
              <RotateCcw className="size-3" /> Resume Job
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-md border border-border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
