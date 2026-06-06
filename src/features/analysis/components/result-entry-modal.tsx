import React, { useState } from "react";
import { X, Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { AnalyticalMethod, AnalyticalResultFull } from "../../../types";
import { evaluateResultQaStatus } from "../../../lib/qa-service";

interface ResultRow {
  element: string;
  value: string;
  unit: string;
  qaStatus: "Pass" | "Flag" | "Pending Approval";
  flagReason?: string;
}

interface ResultEntryModalProps {
  runId: string;
  sampleId: string;
  instrumentId: string;
  analystName: string;
  method: AnalyticalMethod;
  onSubmit: (results: AnalyticalResultFull[]) => void;
  onClose: () => void;
}

const DEFAULT_ROW: ResultRow = {
  element: "",
  value: "",
  unit: "ppm",
  qaStatus: "Pending Approval",
};

export function ResultEntryModal({
  runId,
  sampleId,
  instrumentId,
  analystName,
  method,
  onSubmit,
  onClose,
}: ResultEntryModalProps) {
  const [rows, setRows] = useState<ResultRow[]>([
    ...method.elementsTargeted.slice(0, 6).map((el) => ({ ...DEFAULT_ROW, element: el })),
  ]);

  const updateRow = (idx: number, field: keyof ResultRow, raw: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: raw };

      // Live QA evaluation on value change
      if (field === "value" || field === "element") {
        const val = parseFloat(field === "value" ? raw : updated[idx].value);
        const el = field === "element" ? raw : updated[idx].element;
        if (!isNaN(val) && el) {
          const { qaStatus, flagReason } = evaluateResultQaStatus(val, el, method);
          updated[idx].qaStatus = qaStatus;
          updated[idx].flagReason = flagReason;
        }
      }
      return updated;
    });
  };

  const addRow = () => setRows((p) => [...p, { ...DEFAULT_ROW }]);
  const removeRow = (idx: number) => setRows((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const results: AnalyticalResultFull[] = rows
      .filter((r) => r.element && r.value !== "")
      .map((r, i) => ({
        id: `res-${runId}-${i}`,
        runId,
        sampleId,
        element: r.element,
        value: parseFloat(r.value) || 0,
        unit: r.unit,
        method: method.code,
        instrumentId,
        analystName,
        analyzedAt: now,
        qaStatus: r.qaStatus,
        flagReason: r.flagReason,
      }));
    onSubmit(results);
    onClose();
  };

  const flagCount = rows.filter((r) => r.qaStatus === "Flag").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 sticky top-0 bg-card z-10">
          <div>
            <h3 className="text-base font-semibold text-foreground">Enter Analytical Results</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run <span className="font-mono text-primary">{runId}</span> · Sample{" "}
              <span className="font-mono text-primary">{sampleId}</span> · Method{" "}
              <span className="font-semibold">{method.code}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* QA summary banner */}
        {flagCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {flagCount} result{flagCount > 1 ? "s" : ""} flagged for QA review
            </p>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr className="[&>th]:pb-2 [&>th]:text-left [&>th]:font-semibold">
                <th>Element</th>
                <th>Value</th>
                <th>Unit</th>
                <th>QA Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => (
                <tr key={idx} className="[&>td]:py-2">
                  <td className="pr-3">
                    <input
                      list={`elements-${idx}`}
                      value={row.element}
                      onChange={(e) => updateRow(idx, "element", e.target.value)}
                      placeholder="Au"
                      className="w-20 rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <datalist id={`elements-${idx}`}>
                      {method.elementsTargeted.map((el) => (
                        <option key={el} value={el} />
                      ))}
                    </datalist>
                  </td>
                  <td className="pr-3">
                    <input
                      type="number"
                      step="any"
                      value={row.value}
                      onChange={(e) => updateRow(idx, "value", e.target.value)}
                      placeholder="0.000"
                      className="w-28 rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className="pr-3">
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(idx, "unit", e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      {["ppm", "ppb", "g/t", "%", "mg/kg"].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="pr-3">
                    {row.value !== "" && !isNaN(parseFloat(row.value)) ? (
                      <div className="flex items-center gap-1.5">
                        {row.qaStatus === "Pass" ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : row.qaStatus === "Flag" ? (
                          <AlertTriangle className="size-4 text-amber-500" />
                        ) : null}
                        <span
                          className={`text-xs font-semibold ${
                            row.qaStatus === "Pass"
                              ? "text-emerald-600"
                              : row.qaStatus === "Flag"
                                ? "text-amber-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {row.qaStatus}
                        </span>
                        {row.flagReason && (
                          <span
                            className="text-[10px] text-muted-foreground italic truncate max-w-32"
                            title={row.flagReason}
                          >
                            — {row.flagReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => removeRow(idx)}
                      className="rounded p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addRow}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="size-3.5" /> Add element
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border px-6 py-4 bg-muted/10">
          <span className="text-xs text-muted-foreground">
            {rows.filter((r) => r.element && r.value !== "").length} results ready
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded-md border border-border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rows.filter((r) => r.element && r.value !== "").length === 0}
            className="rounded-md gradient-primary px-4 py-1.5 text-xs text-white font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Submit Results
          </button>
        </div>
      </div>
    </div>
  );
}
