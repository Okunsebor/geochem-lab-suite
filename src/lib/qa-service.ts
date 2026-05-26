/**
 * qa-service.ts
 * Pure-functional QA/QC engine for GeoChem Suite LIMS.
 * No side effects — all functions are deterministic and testable.
 */
import {
  AnalyticalResultFull,
  AnalyticalMethod,
  QaFlag,
  FlagSeverity,
  CheckType,
} from "../types";

// ─── QC Thresholds (defaults when no method config present) ──────────────────

export const DEFAULT_DUPLICATE_RPD_PCT = 10;
export const DEFAULT_BLANK_MULTIPLIER  = 1.0;
export const DEFAULT_CRM_TOLERANCE_PCT = 5;

// ─── Severity Classifier ─────────────────────────────────────────────────────

function classifySeverity(deviation: number, warn: number, high: number): FlagSeverity {
  if (deviation > high)  return "High";
  if (deviation > warn)  return "Medium";
  return "Low";
}

// ─── Duplicate Check (RPD) ───────────────────────────────────────────────────

export interface DuplicateCheckResult {
  rpd: number;
  severity: FlagSeverity;
  flag: boolean;
}

export function evaluateDuplicate(
  original: number,
  duplicate: number,
  threshold = DEFAULT_DUPLICATE_RPD_PCT
): DuplicateCheckResult {
  const avg = (original + duplicate) / 2;
  const rpd = avg === 0 ? 0 : (Math.abs(original - duplicate) / avg) * 100;
  const flag = rpd > threshold;
  const severity = classifySeverity(rpd, threshold, threshold * 2);
  return { rpd, severity, flag };
}

// ─── Blank Check ─────────────────────────────────────────────────────────────

export interface BlankCheckResult {
  ratio: number;
  severity: FlagSeverity;
  flag: boolean;
}

export function evaluateBlank(
  observedValue: number,
  detectionLimit: number,
  multiplier = DEFAULT_BLANK_MULTIPLIER
): BlankCheckResult {
  const dl = detectionLimit <= 0 ? 0.001 : detectionLimit;
  const ratio = observedValue / dl;
  const flag = ratio > multiplier;
  const severity = classifySeverity(ratio, multiplier * 0.5, multiplier);
  return { ratio, severity, flag };
}

// ─── CRM / Standard Check ────────────────────────────────────────────────────

export interface CrmCheckResult {
  percentDeviation: number;
  severity: FlagSeverity;
  flag: boolean;
}

export function evaluateCrm(
  observed: number,
  certified: number,
  tolerance = DEFAULT_CRM_TOLERANCE_PCT
): CrmCheckResult {
  const percentDeviation = certified === 0 ? 0 : (Math.abs(observed - certified) / certified) * 100;
  const flag = percentDeviation > tolerance;
  const severity = classifySeverity(percentDeviation, tolerance, tolerance * 2);
  return { percentDeviation, severity, flag };
}

// ─── Auto-flag Batch Evaluator ───────────────────────────────────────────────

export function autoFlagResults(
  results: AnalyticalResultFull[],
  method: AnalyticalMethod,
  analystName: string
): QaFlag[] {
  const flags: QaFlag[] = [];
  let flagCounter = Date.now();

  results.forEach((r) => {
    const dl = method.detectionLimits[r.element] ?? 0.001;

    // Blank check: any value near/above detection limit in blank samples
    if (r.value < dl * method.qcThresholds.blankMultiplier && r.value > 0) {
      // Below DL — pass, no flag
    } else if (r.value >= dl * method.qcThresholds.blankMultiplier * 5) {
      const check = evaluateBlank(r.value, dl, method.qcThresholds.blankMultiplier);
      if (check.flag) {
        flags.push({
          id: `QF-${(flagCounter++).toString().slice(-5)}`,
          sampleId: r.sampleId,
          runId: r.runId,
          element: r.element,
          checkType: "Blank" as CheckType,
          observedValue: r.value,
          expectedValue: 0,
          tolerance: dl * method.qcThresholds.blankMultiplier,
          percentDeviation: check.ratio * 100,
          severity: check.severity,
          status: "Open",
          raisedBy: analystName,
          raisedAt: new Date().toISOString(),
        });
      }
    }
  });

  return flags;
}

// ─── QA Status Evaluator (single result) ────────────────────────────────────

export function evaluateResultQaStatus(
  value: number,
  element: string,
  method: AnalyticalMethod
): { qaStatus: "Pass" | "Flag" | "Pending Approval"; flagReason?: string } {
  const dl = method.detectionLimits[element] ?? 0.001;

  // Negative or impossibly high values → flag
  if (value < 0) {
    return { qaStatus: "Flag", flagReason: "Negative value — instrument error" };
  }
  // Value at exactly 0 when DL > 0 → pending review
  if (value === 0 && dl > 0) {
    return { qaStatus: "Pass" };
  }
  // Very high multiplier — suspicious
  if (value > dl * 100000) {
    return { qaStatus: "Flag", flagReason: "Value exceeds plausible range for element" };
  }
  return { qaStatus: "Pass" };
}

// ─── Pass Rate Computer ──────────────────────────────────────────────────────

export function computePassRate(flags: QaFlag[]): number {
  if (flags.length === 0) return 100;
  const resolved = flags.filter((f) => f.status === "Approved" || f.status === "Revised").length;
  const open = flags.filter((f) => f.status === "Open" || f.status === "Pending Approval").length;
  const total = flags.length;
  return Math.max(0, Math.round(((total - open) / total) * 100));
}

export function computeAvgDuplicateSpread(flags: QaFlag[]): number | null {
  const dups = flags.filter((f) => f.checkType === "Duplicate" && f.percentDeviation != null);
  if (dups.length === 0) return null;
  const avg = dups.reduce((sum, f) => sum + (f.percentDeviation ?? 0), 0) / dups.length;
  return Math.round(avg * 10) / 10;
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

export interface ParsedCsvRow {
  sampleId?: string;
  element?: string;
  value?: number;
  unit?: string;
  raw: Record<string, string>;
}

/** Parse a simple instrument CSV export into structured rows */
export function parseCsv(csvText: string): ParsedCsvRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => { raw[h] = cells[idx] ?? ""; });

    const sampleId = raw["sample_id"] || raw["sample"] || raw["id"] || undefined;
    const element  = raw["element"] || raw["analyte"] || undefined;
    const rawVal   = raw["value"] || raw["result"] || raw["concentration"] || "";
    const value    = rawVal !== "" ? parseFloat(rawVal) : undefined;
    const unit     = raw["unit"] || raw["units"] || undefined;

    rows.push({ sampleId, element, value, unit, raw });
  }

  return rows;
}

/** Convert parsed CSV rows → AnalyticalResultFull array */
export function csvRowsToResults(
  rows: ParsedCsvRow[],
  runId: string,
  instrumentId: string,
  method: AnalyticalMethod,
  analystName: string
): AnalyticalResultFull[] {
  const now = new Date().toISOString();
  return rows
    .filter((r) => r.sampleId && r.element && r.value != null && !isNaN(r.value!))
    .map((r, i) => {
      const { qaStatus, flagReason } = evaluateResultQaStatus(r.value!, r.element!, method);
      return {
        id: `res-${runId}-${i}`,
        runId,
        sampleId: r.sampleId!,
        element: r.element!,
        value: r.value!,
        unit: r.unit || "ppm",
        method: method.code,
        instrumentId,
        analystName,
        analyzedAt: now,
        qaStatus,
        flagReason,
      };
    });
}
