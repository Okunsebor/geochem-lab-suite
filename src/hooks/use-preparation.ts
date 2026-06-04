import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./use-auth";
import { PrepJob, PrepStep, PrepStage, PrepStepStatus, Priority } from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

export const PREP_STAGES: PrepStage[] = ["Drying", "Crushing", "Splitting", "Pulverizing"];

export const STAGE_EQUIPMENT: Record<PrepStage, string[]> = {
  Drying: ["Oven A", "Oven B", "Oven C", "Oven D"],
  Crushing: ["JC-400", "JC-401", "Jaw Crusher B"],
  Splitting: ["Riffle Splitter", "Rotary Splitter A", "Rotary Splitter B"],
  Pulverizing: ["Pulverizer A-1", "Pulverizer A-2", "Ring Mill B"],
};

export const STAGE_COLOR: Record<PrepStage, string> = {
  Drying: "hsl(38 95% 55%)",
  Crushing: "hsl(210 90% 55%)",
  Splitting: "hsl(270 75% 60%)",
  Pulverizing: "hsl(158 64% 48%)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextStage(stage: PrepStage): PrepStage | null {
  const idx = PREP_STAGES.indexOf(stage);
  return idx < PREP_STAGES.length - 1 ? PREP_STAGES[idx + 1] : null;
}

function buildDefaultSteps(jobId: string, sampleId: string): PrepStep[] {
  return PREP_STAGES.map((stage) => ({
    id: `${jobId}-${stage}`,
    jobId,
    sampleId,
    stage,
    status: "Queued" as PrepStepStatus,
    technicianName: "",
  }));
}

function mapDbJobToUi(job: any, steps: any[]): PrepJob {
  return {
    id: job.id,
    sampleId: job.sample_id,
    client: job.client_name || job.samples?.client_name || "—",
    project: job.project_name || job.samples?.project_name || "—",
    sampleType: job.sample_type || job.samples?.sample_type || "—",
    priority: (job.priority || job.samples?.priority || "Normal") as Priority,
    overallStatus: job.overall_status || "Active",
    currentStage: job.current_stage || "Drying",
    createdAt: job.created_at || new Date().toISOString(),
    steps: steps.map((s: any) => ({
      id: s.id,
      jobId: s.job_id,
      sampleId: s.sample_id,
      stage: s.stage,
      status: s.status || "Queued",
      technicianName: s.technician_name || "",
      technicianId: s.technician_id || undefined,
      equipment: s.equipment || undefined,
      startedAt: s.started_at || undefined,
      completedAt: s.completed_at || undefined,
      durationMinutes: s.duration_minutes || undefined,
      notes: s.notes || undefined,
    })),
  };
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gcs_prep_jobs";

function loadLocal(): PrepJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(jobs: PrepJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface PrepActivityEntry {
  id: string;
  time: string;
  technician: string;
  sampleId: string;
  stage: PrepStage;
  action: "Started" | "Completed" | "Skipped" | "Enrolled" | "Held" | "Resumed";
  equipment?: string;
  duration?: number;
}

export interface UsePreparationReturn {
  prepJobs: PrepJob[];
  prepActivity: PrepActivityEntry[];
  loadingPrep: boolean;
  enrollSampleInPrep: (
    sampleId: string,
    client: string,
    project: string,
    sampleType: string,
    priority: Priority,
  ) => PrepJob;
  startStep: (jobId: string, stage: PrepStage, technician: string, equipment?: string) => void;
  completeStep: (jobId: string, stage: PrepStage, notes?: string) => void;
  skipStep: (jobId: string, stage: PrepStage, reason?: string) => void;
  holdJob: (jobId: string) => void;
  resumeJob: (jobId: string) => void;
  getJobBySampleId: (sampleId: string) => PrepJob | undefined;
  getJobsByStage: (stage: PrepStage) => PrepJob[];
}

export function usePreparation(): UsePreparationReturn {
  const [prepJobs, setPrepJobs] = useState<PrepJob[]>([]);
  const [prepActivity, setPrepActivity] = useState<PrepActivityEntry[]>([]);
  const [loadingPrep, setLoadingPrep] = useState(true);
  const { currentUser } = useAuth();
  const currentName = currentUser?.name || "Lab Staff";

  // ── Sync from Supabase ─────────────────────────────────────────────────────
  const syncFromDb = useCallback(async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from("preparation_jobs")
        .select(
          `
          *,
          preparation_steps (*),
          samples (client_name, project_name, sample_type, priority)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (jobsData && jobsData.length > 0) {
        const mapped = jobsData.map((j: any) => mapDbJobToUi(j, j.preparation_steps || []));
        setPrepJobs(mapped);
        saveLocal(mapped);
        setLoadingPrep(false);
        return;
      }
    } catch (err: any) {
      console.warn("Prep workflow: Supabase unavailable, using sandbox mode:", err.message);
    }

    // Fallback: localStorage
    const local = loadLocal();
    setPrepJobs(local);
    setLoadingPrep(false);
  }, []);

  useEffect(() => {
    syncFromDb();
  }, [syncFromDb]);

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("realtime-prep")
      .on("postgres_changes", { event: "*", schema: "public", table: "preparation_steps" }, () => {
        syncFromDb();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "preparation_jobs" }, () => {
        syncFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncFromDb]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const logActivity = (entry: Omit<PrepActivityEntry, "id" | "time">) => {
    const newEntry: PrepActivityEntry = {
      ...entry,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setPrepActivity((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const updateJobs = (updated: PrepJob[]) => {
    setPrepJobs(updated);
    saveLocal(updated);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const enrollSampleInPrep = useCallback(
    (
      sampleId: string,
      client: string,
      project: string,
      sampleType: string,
      priority: Priority,
    ): PrepJob => {
      const jobId = `job-${sampleId}-${Date.now()}`;
      const newJob: PrepJob = {
        id: jobId,
        sampleId,
        client,
        project,
        sampleType,
        priority,
        overallStatus: "Active",
        currentStage: "Drying",
        steps: buildDefaultSteps(jobId, sampleId),
        createdAt: new Date().toISOString(),
      };

      updateJobs([newJob, ...prepJobs.filter((j) => j.sampleId !== sampleId)]);

      logActivity({
        technician: currentName,
        sampleId,
        stage: "Drying",
        action: "Enrolled",
      });

      // Background DB write
      (async () => {
        try {
          const { data: jobRow, error: jobErr } = await supabase
            .from("preparation_jobs")
            .insert({ sample_id: sampleId, created_by: currentUser?.id?.toString() })
            .select()
            .single();
          if (jobErr) throw jobErr;

          const stepsPayload = PREP_STAGES.map((stage) => ({
            job_id: jobRow.id,
            sample_id: sampleId,
            stage,
            status: "Queued",
          }));
          await supabase.from("preparation_steps").insert(stepsPayload);

          // Update sample status to "In Preparation"
          await supabase.from("samples").update({ status: "In Preparation" }).eq("id", sampleId);

          syncFromDb();
        } catch (err: any) {
          console.warn("Prep enroll DB write failed (sandbox mode):", err.message);
        }
      })();

      return newJob;
    },
    [prepJobs, currentName, currentUser, syncFromDb],
  );

  const startStep = useCallback(
    (jobId: string, stage: PrepStage, technician: string, equipment?: string) => {
      const now = new Date().toISOString();
      const updated = prepJobs.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          currentStage: stage,
          steps: job.steps.map((step) =>
            step.stage === stage
              ? {
                  ...step,
                  status: "In Progress" as PrepStepStatus,
                  technicianName: technician,
                  equipment,
                  startedAt: now,
                }
              : step,
          ),
        };
      });
      updateJobs(updated);

      logActivity({
        technician,
        sampleId: updated.find((j) => j.id === jobId)?.sampleId || "",
        stage,
        action: "Started",
        equipment,
      });

      (async () => {
        try {
          await supabase
            .from("preparation_steps")
            .update({
              status: "In Progress",
              technician_name: technician,
              equipment,
              started_at: now,
            })
            .match({ job_id: jobId, stage });
        } catch (err: any) {
          console.warn("Prep startStep DB write failed:", err.message);
        }
      })();
    },
    [prepJobs],
  );

  const completeStep = useCallback(
    (jobId: string, stage: PrepStage, notes?: string) => {
      const now = new Date().toISOString();
      const updated = prepJobs.map((job) => {
        if (job.id !== jobId) return job;

        const next = nextStage(stage);
        const isLastStage = !next;

        const steps = job.steps.map((step) => {
          if (step.stage === stage) {
            const startedAt = step.startedAt ? new Date(step.startedAt) : new Date();
            const durationMinutes = Math.round(
              (new Date().getTime() - startedAt.getTime()) / 60000,
            );
            return {
              ...step,
              status: "Completed" as PrepStepStatus,
              completedAt: now,
              durationMinutes,
              notes: notes || step.notes,
            };
          }
          return step;
        });

        return {
          ...job,
          currentStage: next || stage,
          overallStatus: isLastStage ? ("Completed" as const) : ("Active" as const),
          steps,
        };
      });
      updateJobs(updated);

      const job = updated.find((j) => j.id === jobId);
      const step = job?.steps.find((s) => s.stage === stage);
      logActivity({
        technician: step?.technicianName || currentName,
        sampleId: job?.sampleId || "",
        stage,
        action: "Completed",
        equipment: step?.equipment,
        duration: step?.durationMinutes,
      });

      // If last stage, advance sample status to "In Analysis"
      const isLast = !nextStage(stage);

      (async () => {
        try {
          await supabase
            .from("preparation_steps")
            .update({ status: "Completed", completed_at: now, notes })
            .match({ job_id: jobId, stage });

          if (isLast && job) {
            await supabase
              .from("preparation_jobs")
              .update({ overall_status: "Completed", current_stage: stage })
              .eq("id", jobId);

            await supabase.from("samples").update({ status: "In Analysis" }).eq("id", job.sampleId);
          } else if (job) {
            await supabase
              .from("preparation_jobs")
              .update({ current_stage: nextStage(stage) })
              .eq("id", jobId);
          }
          syncFromDb();
        } catch (err: any) {
          console.warn("Prep completeStep DB write failed:", err.message);
        }
      })();
    },
    [prepJobs, currentName, syncFromDb],
  );

  const skipStep = useCallback(
    (jobId: string, stage: PrepStage, reason?: string) => {
      const now = new Date().toISOString();
      const updated = prepJobs.map((job) => {
        if (job.id !== jobId) return job;
        const next = nextStage(stage);
        const steps = job.steps.map((step) =>
          step.stage === stage
            ? { ...step, status: "Skipped" as PrepStepStatus, completedAt: now, notes: reason }
            : step,
        );
        return { ...job, currentStage: next || stage, steps };
      });
      updateJobs(updated);

      const job = updated.find((j) => j.id === jobId);
      logActivity({
        technician: currentName,
        sampleId: job?.sampleId || "",
        stage,
        action: "Skipped",
      });

      (async () => {
        try {
          await supabase
            .from("preparation_steps")
            .update({ status: "Skipped", completed_at: now, notes: reason })
            .match({ job_id: jobId, stage });
          const next = nextStage(stage);
          if (next && job) {
            await supabase.from("preparation_jobs").update({ current_stage: next }).eq("id", jobId);
          }
        } catch (err: any) {
          console.warn("Prep skipStep DB write failed:", err.message);
        }
      })();
    },
    [prepJobs, currentName],
  );

  const holdJob = useCallback(
    (jobId: string) => {
      const updated = prepJobs.map((job) =>
        job.id === jobId ? { ...job, overallStatus: "On Hold" as const } : job,
      );
      updateJobs(updated);
      const job = updated.find((j) => j.id === jobId);
      logActivity({
        technician: currentName,
        sampleId: job?.sampleId || "",
        stage: job?.currentStage || "Drying",
        action: "Held",
      });

      (async () => {
        try {
          await supabase
            .from("preparation_jobs")
            .update({ overall_status: "On Hold" })
            .eq("id", jobId);
        } catch {}
      })();
    },
    [prepJobs, currentName],
  );

  const resumeJob = useCallback(
    (jobId: string) => {
      const updated = prepJobs.map((job) =>
        job.id === jobId ? { ...job, overallStatus: "Active" as const } : job,
      );
      updateJobs(updated);
      const job = updated.find((j) => j.id === jobId);
      logActivity({
        technician: currentName,
        sampleId: job?.sampleId || "",
        stage: job?.currentStage || "Drying",
        action: "Resumed",
      });

      (async () => {
        try {
          await supabase
            .from("preparation_jobs")
            .update({ overall_status: "Active" })
            .eq("id", jobId);
        } catch {}
      })();
    },
    [prepJobs, currentName],
  );

  const getJobBySampleId = useCallback(
    (sampleId: string) => prepJobs.find((j) => j.sampleId === sampleId),
    [prepJobs],
  );

  const getJobsByStage = useCallback(
    (stage: PrepStage) =>
      prepJobs.filter((j) => j.overallStatus === "Active" && j.currentStage === stage),
    [prepJobs],
  );

  return {
    prepJobs,
    prepActivity,
    loadingPrep,
    enrollSampleInPrep,
    startStep,
    completeStep,
    skipStep,
    holdJob,
    resumeJob,
    getJobBySampleId,
    getJobsByStage,
  };
}
