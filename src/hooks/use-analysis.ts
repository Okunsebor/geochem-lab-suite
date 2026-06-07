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
    async (sampleId: string, instrumentId: string, method: string, analyst: string): Promise<AnalyticalRun> => {
      const newRun: AnalyticalRun = {
        id: nextRunId(analysisRuns),
        sampleId,
        instrumentId,
        method,
        analystName: analyst || currentName,
        status: "Queued",
        results: [],
      };
      try {
        const { error } = await supabase.from("analytical_runs" as any).insert({
          id: newRun.id,
          sample_id: sampleId,
          instrument_id: instrumentId,
          method,
          analyst_name: newRun.analystName,
          status: "Queued",
        });
        if (error) throw error;

        updateRuns([newRun, ...analysisRuns]);
        return newRun;
      } catch (e: any) {
        toast.error(`Error assigning run: ${e.message}`);
        throw e;
      }
    },
    [analysisRuns, currentName],
  );

  const setRunStatus = async (runId: string, status: RunStatus, extra: Partial<AnalyticalRun> = {}) => {
    try {
      const { error } = await supabase
        .from("analytical_runs" as any)
        .update({ status, ...extra })
        .eq("id", runId);
      if (error) throw error;

      const updated = analysisRuns.map((r) => (r.id === runId ? { ...r, status, ...extra } : r));
      updateRuns(updated);
    } catch (e: any) {
      toast.error(`Error updating run status: ${e.message}`);
      throw e;
    }
  };

  const startRun = useCallback(
    async (runId: string) => await setRunStatus(runId, "Running", { startedAt: new Date().toISOString() }),
    [analysisRuns],
  );
  const completeRun = useCallback(
    async (runId: string) => await setRunStatus(runId, "Complete", { completedAt: new Date().toISOString() }),
    [analysisRuns],
  );
  const failRun = useCallback(async (runId: string) => await setRunStatus(runId, "Failed"), [analysisRuns]);

  const submitResults = useCallback(
    async (runId: string, results: AnalyticalResultFull[]) => {
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
        
        const { error: err1 } = await supabase.from("analytical_results").insert(payload);
        if (err1) throw err1;

        const { error: err2 } = await supabase
          .from("analytical_runs" as any)
          .update({ status: "Complete", completed_at: new Date().toISOString() })
          .eq("id", runId);
        if (err2) throw err2;

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
      } catch (e: any) {
        toast.error(`Error submitting results: ${e.message}`);
        throw e;
      }
    },
    [analysisRuns],
  );

  const uploadRawFile = useCallback(
    async (runId: string, file: File) => {
      const run = analysisRuns.find((r) => r.id === runId);
      const method = SEED_METHODS.find((m) => m.code === run?.method) ?? SEED_METHODS[1];
      let url: string | null = null;
      let results: AnalyticalResultFull[] = [];

      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        const text = await file.text();
        const rows = parseCsv(text);
        results = csvRowsToResults(rows, runId, run?.instrumentId || "", method, currentName);
      }

      try {
        const filePath = `raw-data/${runId}-${file.name}`;
        const { error } = await supabase.storage
          .from("raw-data")
          .upload(filePath, file, { upsert: true });
        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("raw-data").getPublicUrl(filePath);
        url = publicUrl;

        const updated = analysisRuns.map((r) =>
          r.id === runId
            ? { ...r, rawFileUrl: url || undefined, rawFileName: file.name, results }
            : r,
        );
        updateRuns(updated);

        if (results.length > 0) {
           await submitResults(runId, results);
        }

        return { url, results };
      } catch (e: any) {
        toast.error(`Error uploading raw file: ${e.message}`);
        throw e;
      }
    },
    [analysisRuns, currentName, submitResults],
  );

  const addCalibrationRecord = useCallback(
    async (record: Omit<CalibrationRecord, "id">) => {
      const newRec: CalibrationRecord = { ...record, id: `cal-${Date.now()}` };
      try {
        const { error } = await supabase.from("calibration_records" as any).insert({
          instrument_id: record.instrumentId,
          performed_by: record.performedBy,
          calibration_date: record.calibrationDate,
          next_due_date: record.nextDueDate,
          standard_used: record.standardUsed,
          r2_value: record.r2Value,
          pass_status: record.passStatus,
          notes: record.notes,
        });
        if (error) throw error;

        const updated = [newRec, ...calibrationRecords];
        setCalibrationRecords(updated);
        saveLocal(STORAGE_CAL, updated);
      } catch (e: any) {
        toast.error(`Error adding calibration record: ${e.message}`);
        throw e;
      }
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
