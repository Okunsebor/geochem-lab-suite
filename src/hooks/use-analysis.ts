import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./use-auth";
import {
  AnalyticalRun,
  AnalyticalResultFull,
  CalibrationRecord,
  AnalyticalMethod,
  RunStatus,
} from "../types";
import { csvRowsToResults, parseCsv } from "../lib/qa-service";

// ─── Seed Methods (fallback) ──────────────────────────────────────────────────

const SEED_METHODS: AnalyticalMethod[] = [
  {
    id: "m1",
    code: "FA-AAS",
    name: "Fire Assay AAS",
    description: "Fire assay with AAS finish for gold determination",
    elementsTargeted: ["Au"],
    instrumentTypes: ["AAS"],
    detectionLimits: { Au: 0.001 },
    qcThresholds: { duplicateRpd: 10, blankMultiplier: 1.0, crmTolerance: 5 },
  },
  {
    id: "m2",
    code: "ICP-MS-51E",
    name: "ICP-MS 51-Element Package",
    description: "51-element trace package by ICP-MS",
    elementsTargeted: [
      "Ag",
      "As",
      "Ba",
      "Cd",
      "Co",
      "Cr",
      "Cu",
      "Hg",
      "Mo",
      "Ni",
      "Pb",
      "Sb",
      "Zn",
    ],
    instrumentTypes: ["ICP-MS"],
    detectionLimits: { Au: 0.001, Ag: 0.01, Cu: 0.01, Pb: 0.01, Zn: 0.01 },
    qcThresholds: { duplicateRpd: 15, blankMultiplier: 1.0, crmTolerance: 5 },
  },
  {
    id: "m3",
    code: "ICP-OES-4A",
    name: "ICP-OES 4-Acid Digestion",
    description: "Major and minor elements via 4-acid digestion",
    elementsTargeted: ["Al", "Ca", "Fe", "K", "Mg", "Mn", "Cu", "Pb", "Zn"],
    instrumentTypes: ["ICP-OES"],
    detectionLimits: { Cu: 0.01, Pb: 0.01, Zn: 0.01 },
    qcThresholds: { duplicateRpd: 10, blankMultiplier: 1.0, crmTolerance: 5 },
  },
  {
    id: "m4",
    code: "LECO-CS",
    name: "LECO Carbon/Sulfur",
    description: "Total carbon and sulfur determination",
    elementsTargeted: ["C", "S"],
    instrumentTypes: ["LECO"],
    detectionLimits: { C: 0.01, S: 0.01 },
    qcThresholds: { duplicateRpd: 10, blankMultiplier: 1.0, crmTolerance: 5 },
  },
  {
    id: "m5",
    code: "AR-ICP-MS",
    name: "Aqua Regia ICP-MS",
    description: "Multi-element by aqua regia digestion and ICP-MS",
    elementsTargeted: [
      "Au",
      "Ag",
      "As",
      "Bi",
      "Cd",
      "Co",
      "Cu",
      "Fe",
      "Hg",
      "Mo",
      "Ni",
      "Pb",
      "Sb",
      "Zn",
    ],
    instrumentTypes: ["ICP-MS"],
    detectionLimits: { Au: 0.001, Ag: 0.01, Cu: 0.01 },
    qcThresholds: { duplicateRpd: 15, blankMultiplier: 1.0, crmTolerance: 5 },
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_RUNS = "gcs_analysis_runs";
const STORAGE_CAL = "gcs_calibration_records";

function loadLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function saveLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextRunId(existing: AnalyticalRun[]): string {
  const max = existing.reduce((m, r) => {
    const n = parseInt(r.id.replace("RUN-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 10000);
  return `RUN-${max + 1}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAnalysisReturn {
  analysisRuns: AnalyticalRun[];
  calibrationRecords: CalibrationRecord[];
  analyticalMethods: AnalyticalMethod[];
  loadingAnalysis: boolean;
  assignSampleToInstrument: (
    sampleId: string,
    instrumentId: string,
    method: string,
    analyst: string,
  ) => AnalyticalRun;
  startRun: (runId: string) => void;
  completeRun: (runId: string) => void;
  failRun: (runId: string) => void;
  submitResults: (runId: string, results: AnalyticalResultFull[]) => void;
  uploadRawFile: (
    runId: string,
    file: File,
  ) => Promise<{ url: string | null; results: AnalyticalResultFull[] }>;
  addCalibrationRecord: (record: Omit<CalibrationRecord, "id">) => void;
  getRunsBySample: (sampleId: string) => AnalyticalRun[];
  getRunsByInstrument: (instrumentId: string) => AnalyticalRun[];
  getMethodByCode: (code: string) => AnalyticalMethod | undefined;
}

export function useAnalysis(): UseAnalysisReturn {
  const [analysisRuns, setAnalysisRuns] = useState<AnalyticalRun[]>([]);
  const [calibrationRecords, setCalibrationRecords] = useState<CalibrationRecord[]>([]);
  const [analyticalMethods] = useState<AnalyticalMethod[]>(SEED_METHODS);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const { currentUser } = useAuth();
  const currentName = currentUser?.name || "Lab Staff";

  // ── Sync ──────────────────────────────────────────────────────────────────
  const syncFromDb = useCallback(async () => {
    try {
      const { data: runsData, error } = await supabase
        .from("analytical_runs" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (runsData && runsData.length > 0) {
        const mapped: AnalyticalRun[] = runsData.map((r: any) => ({
          id: r.id,
          sampleId: r.sample_id,
          instrumentId: r.instrument_id,
          method: r.method,
          analystName: r.analyst_name,
          status: r.status as RunStatus,
          startedAt: r.started_at,
          completedAt: r.completed_at,
          rawFileUrl: r.raw_file_url,
          rawFileName: r.raw_file_name,
          results: [],
        }));
        setAnalysisRuns(mapped);
        saveLocal(STORAGE_RUNS, mapped);
        setLoadingAnalysis(false);
        return;
      }
    } catch (err: any) {
      console.warn("Analysis: Supabase unavailable, using sandbox mode:", err.message);
    }
    const local = loadLocal<AnalyticalRun>(STORAGE_RUNS);
    setAnalysisRuns(local);
    setLoadingAnalysis(false);
  }, []);

  useEffect(() => {
    syncFromDb();
  }, [syncFromDb]);

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel("realtime-analysis")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytical_runs" as any },
        syncFromDb,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [syncFromDb]);

  // ── Calibration Sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const local = loadLocal<CalibrationRecord>(STORAGE_CAL);
    if (local.length > 0) {
      setCalibrationRecords(local);
      return;
    }
    // Seed calibration records
    const seeded: CalibrationRecord[] = [
      {
        id: "cal-1",
        instrumentId: "ICP-MS-01",
        performedBy: "K. Nakamura",
        calibrationDate: new Date(Date.now() - 14 * 3600000).toISOString(),
        nextDueDate: new Date(Date.now() + 10 * 3600000).toISOString(),
        standardUsed: "OREAS 234",
        r2Value: 0.9994,
        passStatus: true,
      },
      {
        id: "cal-2",
        instrumentId: "XRF-02",
        performedBy: "S. Patel",
        calibrationDate: new Date(Date.now() - 6 * 3600000).toISOString(),
        nextDueDate: new Date(Date.now() + 18 * 3600000).toISOString(),
        standardUsed: "OREAS 145b",
        r2Value: 0.9981,
        passStatus: true,
      },
      {
        id: "cal-3",
        instrumentId: "AAS-04",
        performedBy: "E. Okafor",
        calibrationDate: new Date(Date.now() - 3 * 3600000).toISOString(),
        nextDueDate: new Date(Date.now() + 21 * 3600000).toISOString(),
        standardUsed: "OREAS 460",
        r2Value: 0.9976,
        passStatus: true,
      },
    ];
    setCalibrationRecords(seeded);
    saveLocal(STORAGE_CAL, seeded);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateRuns = (updated: AnalyticalRun[]) => {
    setAnalysisRuns(updated);
    saveLocal(STORAGE_RUNS, updated);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const assignSampleToInstrument = useCallback(
    (sampleId: string, instrumentId: string, method: string, analyst: string): AnalyticalRun => {
      const newRun: AnalyticalRun = {
        id: nextRunId(analysisRuns),
        sampleId,
        instrumentId,
        method,
        analystName: analyst || currentName,
        status: "Queued",
        results: [],
      };
      updateRuns([newRun, ...analysisRuns]);
      (async () => {
        try {
          await supabase.from("analytical_runs" as any).insert({
            id: newRun.id,
            sample_id: sampleId,
            instrument_id: instrumentId,
            method,
            analyst_name: newRun.analystName,
            status: "Queued",
          });
        } catch (e: any) {
          console.warn("Assign run DB write failed:", e.message);
        }
      })();
      return newRun;
    },
    [analysisRuns, currentName],
  );

  const setRunStatus = (runId: string, status: RunStatus, extra: Partial<AnalyticalRun> = {}) => {
    const updated = analysisRuns.map((r) => (r.id === runId ? { ...r, status, ...extra } : r));
    updateRuns(updated);
    (async () => {
      try {
        await supabase
          .from("analytical_runs" as any)
          .update({ status, ...extra })
          .eq("id", runId);
      } catch (e: any) {
        console.warn("Run status DB update failed:", e.message);
      }
    })();
  };

  const startRun = useCallback(
    (runId: string) => setRunStatus(runId, "Running", { startedAt: new Date().toISOString() }),
    [analysisRuns],
  );
  const completeRun = useCallback(
    (runId: string) => setRunStatus(runId, "Complete", { completedAt: new Date().toISOString() }),
    [analysisRuns],
  );
  const failRun = useCallback((runId: string) => setRunStatus(runId, "Failed"), [analysisRuns]);

  const submitResults = useCallback(
    (runId: string, results: AnalyticalResultFull[]) => {
      const updated = analysisRuns.map((r) =>
        r.id === runId
          ? {
              ...r,
              results,
              status: "Complete" as RunStatus,
              completedAt: new Date().toISOString(),
            }
          : r,
      );
      updateRuns(updated);
      (async () => {
        try {
          const payload = results.map((res) => ({
            sample_id: res.sampleId,
            element: res.element,
            value: String(res.value),
            unit: res.unit,
            method: res.method,
            instrument_id: res.instrumentId,
            analyst_name: res.analystName,
            qa_status: res.qaStatus,
            flag_reason: res.flagReason,
            run_id: runId,
          }));
          await supabase.from("analytical_results").insert(payload);
          await supabase
            .from("analytical_runs" as any)
            .update({ status: "Complete", completed_at: new Date().toISOString() })
            .eq("id", runId);
        } catch (e: any) {
          console.warn("Submit results DB write failed:", e.message);
        }
      })();
    },
    [analysisRuns],
  );

  const uploadRawFile = useCallback(
    async (runId: string, file: File) => {
      const run = analysisRuns.find((r) => r.id === runId);
      const method = SEED_METHODS.find((m) => m.code === run?.method) ?? SEED_METHODS[1];
      let url: string | null = null;
      let results: AnalyticalResultFull[] = [];

      // Parse CSV client-side
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        const text = await file.text();
        const rows = parseCsv(text);
        results = csvRowsToResults(rows, runId, run?.instrumentId || "", method, currentName);
      }

      // Upload to Supabase Storage
      try {
        const filePath = `raw-data/${runId}-${file.name}`;
        const { error } = await supabase.storage
          .from("raw-data")
          .upload(filePath, file, { upsert: true });
        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("raw-data").getPublicUrl(filePath);
          url = publicUrl;
        }
      } catch (e: any) {
        console.warn("Raw file upload failed:", e.message);
      }

      const updated = analysisRuns.map((r) =>
        r.id === runId
          ? { ...r, rawFileUrl: url || undefined, rawFileName: file.name, results }
          : r,
      );
      updateRuns(updated);
      if (results.length > 0) submitResults(runId, results);
      return { url, results };
    },
    [analysisRuns, currentName, submitResults],
  );

  const addCalibrationRecord = useCallback(
    (record: Omit<CalibrationRecord, "id">) => {
      const newRec: CalibrationRecord = { ...record, id: `cal-${Date.now()}` };
      const updated = [newRec, ...calibrationRecords];
      setCalibrationRecords(updated);
      saveLocal(STORAGE_CAL, updated);
      (async () => {
        try {
          await supabase.from("calibration_records" as any).insert({
            instrument_id: record.instrumentId,
            performed_by: record.performedBy,
            calibration_date: record.calibrationDate,
            next_due_date: record.nextDueDate,
            standard_used: record.standardUsed,
            r2_value: record.r2Value,
            pass_status: record.passStatus,
            notes: record.notes,
          });
        } catch (e: any) {
          console.warn("Calibration record DB write failed:", e.message);
        }
      })();
    },
    [calibrationRecords],
  );

  const getRunsBySample = useCallback(
    (sampleId: string) => analysisRuns.filter((r) => r.sampleId === sampleId),
    [analysisRuns],
  );
  const getRunsByInstrument = useCallback(
    (instrumentId: string) => analysisRuns.filter((r) => r.instrumentId === instrumentId),
    [analysisRuns],
  );
  const getMethodByCode = useCallback(
    (code: string) => SEED_METHODS.find((m) => m.code === code),
    [],
  );

  return {
    analysisRuns,
    calibrationRecords,
    analyticalMethods,
    loadingAnalysis,
    assignSampleToInstrument,
    startRun,
    completeRun,
    failRun,
    submitResults,
    uploadRawFile,
    addCalibrationRecord,
    getRunsBySample,
    getRunsByInstrument,
    getMethodByCode,
  };
}
