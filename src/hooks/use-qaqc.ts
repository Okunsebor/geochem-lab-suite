import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./use-auth";
import { QaFlag, FlagStatus, CheckType, FlagSeverity } from "../types";
import { computePassRate, computeAvgDuplicateSpread } from "../lib/qa-service";

// ─── Seed Flags (sandbox fallback) ───────────────────────────────────────────

const SEED_FLAGS: QaFlag[] = [
  {
    id: "QF-441",
    sampleId: "GCS-24004",
    element: "Au",
    checkType: "Duplicate",
    observedValue: 2.91,
    expectedValue: 2.41,
    percentDeviation: 18.7,
    severity: "High",
    status: "Pending Approval",
    raisedBy: "System",
    raisedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "QF-440",
    sampleId: "GCS-24016",
    element: "Cu",
    checkType: "Blank",
    observedValue: 0.021,
    expectedValue: 0,
    percentDeviation: 210,
    severity: "Medium",
    status: "Pending Approval",
    raisedBy: "System",
    raisedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "QF-438",
    sampleId: "GCS-24008",
    element: "Zn",
    checkType: "CRM",
    observedValue: 1.88,
    expectedValue: 2.04,
    percentDeviation: 7.8,
    severity: "Low",
    status: "Approved",
    raisedBy: "System",
    raisedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    resolvedBy: "M. Rivera",
    resolvedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    resolution: "Within acceptable tolerance for this matrix",
  },
  {
    id: "QF-435",
    sampleId: "GCS-24001",
    element: "Pb",
    checkType: "Duplicate",
    observedValue: 0.41,
    expectedValue: 0.34,
    percentDeviation: 18.5,
    severity: "Medium",
    status: "Revised",
    raisedBy: "System",
    raisedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolvedBy: "K. Nakamura",
    resolvedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    resolution: "Re-run confirmed — original sample heterogeneous. Accepted.",
  },
];

const STORAGE_KEY = "gcs_qa_flags";

function loadLocal(): QaFlag[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal(flags: QaFlag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseQaqcReturn {
  qaFlags: QaFlag[];
  loadingFlags: boolean;
  passRate: number;
  openFlagCount: number;
  crmOutOfSpec: number;
  avgDuplicateSpread: number | null;
  resolveFlag: (flagId: string, resolution: string, action: "Approved" | "Revised") => void;
  raiseFlag: (flag: Omit<QaFlag, "id" | "raisedAt" | "raisedBy">) => QaFlag;
  dismissFlag: (flagId: string) => void;
  getOpenFlags: () => QaFlag[];
  getFlagsBySample: (sampleId: string) => QaFlag[];
  getFlagsByCheckType: (type: CheckType) => QaFlag[];
}

export function useQaqc(): UseQaqcReturn {
  const [qaFlags, setQaFlags] = useState<QaFlag[]>([]);
  const [loadingFlags, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const currentName = currentUser?.name || "Lab Staff";

  // ── Sync ──────────────────────────────────────────────────────────────────
  const syncFromDb = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("qa_flags" as any)
        .select("*")
        .order("raised_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: QaFlag[] = data.map((f: any) => ({
          id: f.id,
          sampleId: f.sample_id,
          runId: f.run_id,
          element: f.element,
          checkType: f.check_type as CheckType,
          observedValue: Number(f.observed_value),
          expectedValue: f.expected_value ? Number(f.expected_value) : undefined,
          tolerance: f.tolerance ? Number(f.tolerance) : undefined,
          percentDeviation: f.percent_deviation ? Number(f.percent_deviation) : undefined,
          severity: f.severity as FlagSeverity,
          status: f.status as FlagStatus,
          raisedBy: f.raised_by,
          raisedAt: f.raised_at,
          resolvedBy: f.resolved_by,
          resolvedAt: f.resolved_at,
          resolution: f.resolution,
        }));
        setQaFlags(mapped);
        saveLocal(mapped);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn("QA/QC: Supabase unavailable, using sandbox mode:", err.message);
    }
    const local = loadLocal();
    setQaFlags(local.length > 0 ? local : SEED_FLAGS);
    if (local.length === 0) saveLocal(SEED_FLAGS);
    setLoading(false);
  }, []);

  useEffect(() => {
    syncFromDb();
  }, [syncFromDb]);

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel("realtime-qaqc")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qa_flags" as any },
        syncFromDb,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [syncFromDb]);

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const passRate = useMemo(() => computePassRate(qaFlags), [qaFlags]);
  const openFlagCount = useMemo(
    () => qaFlags.filter((f) => f.status === "Open" || f.status === "Pending Approval").length,
    [qaFlags],
  );
  const crmOutOfSpec = useMemo(
    () =>
      qaFlags.filter(
        (f) => f.checkType === "CRM" && (f.status === "Open" || f.status === "Pending Approval"),
      ).length,
    [qaFlags],
  );
  const avgDuplicateSpread = useMemo(() => computeAvgDuplicateSpread(qaFlags), [qaFlags]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateFlags = (updated: QaFlag[]) => {
    setQaFlags(updated);
    saveLocal(updated);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const resolveFlag = useCallback(
    (flagId: string, resolution: string, action: "Approved" | "Revised") => {
      const now = new Date().toISOString();
      const updated = qaFlags.map((f) =>
        f.id === flagId
          ? {
              ...f,
              status: action as FlagStatus,
              resolvedBy: currentName,
              resolvedAt: now,
              resolution,
            }
          : f,
      );
      updateFlags(updated);
      (async () => {
        try {
          await supabase
            .from("qa_flags" as any)
            .update({
              status: action,
              resolved_by: currentName,
              resolved_at: now,
              resolution,
            })
            .eq("id", flagId);
        } catch (e: any) {
          console.warn("Flag resolve DB write failed:", e.message);
        }
      })();
    },
    [qaFlags, currentName],
  );

  const raiseFlag = useCallback(
    (flag: Omit<QaFlag, "id" | "raisedAt" | "raisedBy">): QaFlag => {
      const newFlag: QaFlag = {
        ...flag,
        id: `QF-${(Date.now() % 100000).toString().padStart(3, "0")}`,
        raisedBy: currentName,
        raisedAt: new Date().toISOString(),
      };
      const updated = [newFlag, ...qaFlags];
      updateFlags(updated);
      (async () => {
        try {
          await supabase.from("qa_flags" as any).insert({
            id: newFlag.id,
            sample_id: newFlag.sampleId,
            run_id: newFlag.runId,
            element: newFlag.element,
            check_type: newFlag.checkType,
            observed_value: newFlag.observedValue,
            expected_value: newFlag.expectedValue,
            tolerance: newFlag.tolerance,
            percent_deviation: newFlag.percentDeviation,
            severity: newFlag.severity,
            status: newFlag.status,
            raised_by: newFlag.raisedBy,
          });
        } catch (e: any) {
          console.warn("Raise flag DB write failed:", e.message);
        }
      })();
      return newFlag;
    },
    [qaFlags, currentName],
  );

  const dismissFlag = useCallback(
    (flagId: string) => {
      const updated = qaFlags.filter((f) => f.id !== flagId);
      updateFlags(updated);
    },
    [qaFlags],
  );

  const getOpenFlags = useCallback(
    () => qaFlags.filter((f) => f.status === "Open" || f.status === "Pending Approval"),
    [qaFlags],
  );
  const getFlagsBySample = useCallback(
    (sampleId: string) => qaFlags.filter((f) => f.sampleId === sampleId),
    [qaFlags],
  );
  const getFlagsByCheckType = useCallback(
    (type: CheckType) => qaFlags.filter((f) => f.checkType === type),
    [qaFlags],
  );

  return {
    qaFlags,
    loadingFlags,
    passRate,
    openFlagCount,
    crmOutOfSpec,
    avgDuplicateSpread,
    resolveFlag,
    raiseFlag,
    dismissFlag,
    getOpenFlags,
    getFlagsBySample,
    getFlagsByCheckType,
  };
}
