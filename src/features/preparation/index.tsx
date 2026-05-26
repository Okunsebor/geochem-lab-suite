import React, { useState } from "react";
import { Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { PrepJob, Priority } from "../../types";
import { PageHeader } from "../../components/lims/page-header";
import { useLimsState } from "../../hooks/use-lims-state";
import { usePreparation } from "../../hooks/use-preparation";
import { PrepStatsBar } from "./components/prep-stats-bar";
import { PrepKanban } from "./components/prep-kanban";
import { PrepJobModal } from "./components/prep-job-modal";
import { PrepEnrollModal } from "./components/prep-enroll-modal";
import { PrepActivityLog } from "./components/prep-activity-log";

export function PreparationFeature() {
  const { samples, updateSampleStatus } = useLimsState();
  const {
    prepJobs,
    prepActivity,
    loadingPrep,
    enrollSampleInPrep,
    startStep,
    completeStep,
    skipStep,
    holdJob,
    resumeJob,
  } = usePreparation();

  const [selectedJob, setSelectedJob] = useState<PrepJob | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const enrolledIds = new Set(prepJobs.map((j) => j.sampleId));

  const handleEnroll = (
    sampleId: string,
    client: string,
    project: string,
    sampleType: string,
    priority: Priority
  ) => {
    enrollSampleInPrep(sampleId, client, project, sampleType, priority);
    updateSampleStatus(sampleId, "In Preparation");
    toast.success(`Sample ${sampleId} enrolled in preparation queue`, {
      description: "Starting with Drying stage",
    });
  };

  const handleCompleteStep: typeof completeStep = (jobId, stage, notes) => {
    completeStep(jobId, stage, notes);

    // If last stage completed, advance sample status in the UI layer
    const job = prepJobs.find((j) => j.id === jobId);
    if (job && stage === "Pulverizing") {
      updateSampleStatus(job.sampleId, "In Analysis");
      toast.success(`Sample ${job.sampleId} preparation complete!`, {
        description: "Moved to Analysis queue",
      });
    } else if (job) {
      toast.success(`${stage} stage completed for ${job.sampleId}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Preparation" }]}
        title="Preparation Workflow"
        description="Manage sample preparation stages: Drying → Crushing → Splitting → Pulverizing."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground font-semibold cursor-pointer hover:bg-muted shadow-sm transition"
            >
              <FlaskConical className="size-3.5" /> Enroll Samples
            </button>
            <button
              onClick={() => {
                // Quick-enroll first eligible verified sample
                const eligible = samples.find(
                  (s) => s.status === "Verified" && !enrolledIds.has(s.id)
                );
                if (!eligible) {
                  toast.info("No verified samples available to assign");
                  return;
                }
                handleEnroll(
                  eligible.id,
                  eligible.client,
                  eligible.project,
                  eligible.type,
                  eligible.priority
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
            >
              <Plus className="size-3.5" /> Assign Batch
            </button>
          </div>
        }
      />

      {/* Stats */}
      <PrepStatsBar prepJobs={prepJobs} />

      {/* Kanban */}
      {loadingPrep ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading preparation queue…</span>
        </div>
      ) : prepJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-xl border border-dashed border-border text-center">
          <FlaskConical className="size-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold text-foreground">No samples in preparation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enroll verified samples to begin the preparation workflow
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold hover:opacity-90 transition"
          >
            <Plus className="size-3.5" /> Enroll First Sample
          </button>
        </div>
      ) : (
        <PrepKanban
          prepJobs={prepJobs}
          onCardClick={(job) => setSelectedJob(job)}
          actions={{ startStep, completeStep, skipStep }}
        />
      )}

      {/* Activity log */}
      <PrepActivityLog activity={prepActivity} />

      {/* Job management modal */}
      {selectedJob && (
        <PrepJobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          actions={{ startStep, completeStep: handleCompleteStep, skipStep, holdJob, resumeJob }}
        />
      )}

      {/* Enroll modal */}
      {showEnrollModal && (
        <PrepEnrollModal
          samples={samples}
          enrolledSampleIds={enrolledIds}
          onEnroll={handleEnroll}
          onClose={() => setShowEnrollModal(false)}
        />
      )}
    </div>
  );
}
