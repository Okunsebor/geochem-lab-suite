import React, { useState } from "react";
import { Upload, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../components/lims/page-header";
import { useLimsState } from "../../hooks/use-lims-state";
import { useAnalysis } from "../../hooks/use-analysis";
import { useQaqc } from "../../hooks/use-qaqc";
import { InstrumentStatusGrid } from "./components/instrument-status-grid";
import { AnalysisQueueTable } from "./components/analysis-queue-table";
import { ResultEntryModal } from "./components/result-entry-modal";
import { RawUploadPanel } from "./components/raw-upload-panel";
import { CalibrationLog } from "./components/calibration-log";
import { MethodLibrary } from "./components/method-library";
import { AnalyticalResultFull } from "../../types";

interface AssignModal {
  instrumentId: string;
}

export function AnalysisFeature() {
  const { samples, instruments, updateSampleStatus } = useLimsState();
  const {
    analysisRuns, calibrationRecords, analyticalMethods, loadingAnalysis,
    assignSampleToInstrument, startRun, completeRun, failRun,
    submitResults, uploadRawFile, addCalibrationRecord, getMethodByCode,
  } = useAnalysis();
  const { raiseFlag } = useQaqc();

  const [assignModal, setAssignModal] = useState<AssignModal | null>(null);
  const [resultModal, setResultModal] = useState<string | null>(null); // runId
  const [uploadRunId,  setUploadRunId]  = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [selectedMethod,   setSelectedMethod]   = useState(analyticalMethods[0]?.code || "");
  const [analystName,      setAnalystName]       = useState("");

  const inAnalysisSamples = samples.filter((s) => s.status === "In Analysis");

  // ── Assign handler ────────────────────────────────────────────────────────
  const handleAssignConfirm = () => {
    if (!assignModal || !selectedSampleId) return;
    const run = assignSampleToInstrument(selectedSampleId, assignModal.instrumentId, selectedMethod, analystName);
    toast.success(`Sample ${selectedSampleId} assigned to ${assignModal.instrumentId}`, {
      description: `Run ${run.id} created · Method: ${selectedMethod}`,
    });
    setAssignModal(null);
    setSelectedSampleId("");
  };

  // ── Result submit handler ────────────────────────────────────────────────
  const handleSubmitResults = (results: AnalyticalResultFull[]) => {
    if (!resultModal) return;
    const run = analysisRuns.find((r) => r.id === resultModal);
    submitResults(resultModal, results);

    // Advance sample status
    if (run) updateSampleStatus(run.sampleId, "Completed");

    // Auto-raise flags for flagged results
    const flagged = results.filter((r) => r.qaStatus === "Flag");
    flagged.forEach((r) => {
      raiseFlag({
        sampleId: r.sampleId, runId: r.runId, element: r.element,
        checkType: "Standard", observedValue: r.value,
        severity: "Medium", status: "Open",
      });
    });

    toast.success(`${results.length} results submitted for ${run?.sampleId}`, {
      description: flagged.length > 0 ? `${flagged.length} flag(s) raised for QA review` : "All results passed QA",
    });
    setResultModal(null);
  };

  const activeRun = resultModal ? analysisRuns.find((r) => r.id === resultModal) : null;
  const activeMethod = activeRun ? getMethodByCode(activeRun.method) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Analysis" }]}
        title="Analysis"
        description="Instrument queues, raw data ingestion, result entry, and calibration management."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const run = analysisRuns.find((r) => r.status === "Running" || r.status === "Queued");
                if (!run) { toast.info("No active runs to upload to"); return; }
                setUploadRunId(run.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground font-semibold hover:bg-muted shadow-sm transition"
            >
              <Upload className="size-3.5" /> Upload raw data
            </button>
            <button
              onClick={() => {
                const sample = inAnalysisSamples[0];
                if (!sample) { toast.info("No samples in Analysis queue"); return; }
                const inst = instruments.find((i) => i.status === "Online");
                if (!inst)  { toast.info("No online instruments available"); return; }
                setAssignModal({ instrumentId: inst.id });
                setSelectedSampleId(sample.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
            >
              <Plus className="size-3.5" /> Assign to Instrument
            </button>
          </div>
        }
      />

      {/* Instrument status grid */}
      <InstrumentStatusGrid
        instruments={instruments}
        runs={analysisRuns}
        inAnalysisSamples={inAnalysisSamples}
        onAssign={(instrumentId) => {
          setAssignModal({ instrumentId });
          setSelectedSampleId(inAnalysisSamples[0]?.id || "");
        }}
      />

      {/* Queue + Method Library */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loadingAnalysis ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground gap-3 rounded-xl border border-border bg-card">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading analysis queue…</span>
            </div>
          ) : (
            <AnalysisQueueTable
              runs={analysisRuns}
              onStart={(runId) => { startRun(runId); toast.info(`Run ${runId} started`); }}
              onComplete={(runId) => {
                completeRun(runId);
                setResultModal(runId);
              }}
              onFail={(runId) => { failRun(runId); toast.error(`Run ${runId} marked as failed`); }}
            />
          )}
        </div>
        <MethodLibrary methods={analyticalMethods} />
      </div>

      {/* Raw upload panel — shown for selected run */}
      {uploadRunId && (
        <RawUploadPanel
          runId={uploadRunId}
          onUpload={async (file) => {
            const result = await uploadRawFile(uploadRunId, file);
            if (result.results.length > 0) {
              const run = analysisRuns.find((r) => r.id === uploadRunId);
              if (run) updateSampleStatus(run.sampleId, "Completed");
              toast.success(`${result.results.length} results imported from ${file.name}`);
            }
            setUploadRunId(null);
            return result;
          }}
        />
      )}

      {/* Calibration log */}
      <CalibrationLog
        calibrationRecords={calibrationRecords}
        instruments={instruments}
        onAddRecord={(rec) => {
          addCalibrationRecord(rec);
          toast.success(`Calibration record saved for ${rec.instrumentId}`);
        }}
      />

      {/* Assign to instrument modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Assign Sample — <span className="font-mono text-primary">{assignModal.instrumentId}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sample</label>
                <select value={selectedSampleId} onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {inAnalysisSamples.length === 0
                    ? <option value="">No samples in analysis queue</option>
                    : inAnalysisSamples.map((s) => (
                        <option key={s.id} value={s.id}>{s.id} — {s.client} ({s.project})</option>
                      ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analytical Method</label>
                <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {analyticalMethods.map((m) => (
                    <option key={m.id} value={m.code}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analyst</label>
                <input value={analystName} onChange={(e) => setAnalystName(e.target.value)}
                  placeholder="Analyst name"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setAssignModal(null)}
                className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition">
                Cancel
              </button>
              <button onClick={handleAssignConfirm} disabled={!selectedSampleId}
                className="flex-1 rounded-md gradient-primary py-2 text-sm text-white font-semibold hover:opacity-90 transition disabled:opacity-40">
                <ClipboardList className="inline size-3.5 mr-1.5" />
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result entry modal */}
      {resultModal && activeMethod && activeRun && (
        <ResultEntryModal
          runId={resultModal}
          sampleId={activeRun.sampleId}
          instrumentId={activeRun.instrumentId}
          analystName={activeRun.analystName}
          method={activeMethod}
          onSubmit={handleSubmitResults}
          onClose={() => setResultModal(null)}
        />
      )}
    </div>
  );
}
