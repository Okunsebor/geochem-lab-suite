import React, { useState } from "react";
import { X, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { QaFlag, FlagSeverity } from "../../../types";

interface FlagResolveModalProps {
  flag: QaFlag;
  onResolve: (flagId: string, resolution: string, action: "Approved" | "Revised") => void;
  onClose: () => void;
}

const SEVERITY_META: Record<FlagSeverity, { label: string; color: string; bg: string }> = {
  Low: { label: "Low", color: "text-sky-600", bg: "bg-sky-500/10" },
  Medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-500/10" },
  High: { label: "High", color: "text-rose-600", bg: "bg-rose-500/10" },
};

export function FlagResolveModal({ flag, onResolve, onClose }: FlagResolveModalProps) {
  const [resolution, setResolution] = useState(flag.resolution || "");
  const [action, setAction] = useState<"Approved" | "Revised">("Approved");
  const meta = SEVERITY_META[flag.severity];

  const handleSubmit = () => {
    if (!resolution.trim()) return;
    onResolve(flag.id, resolution, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <span className="font-mono text-sm font-bold text-primary">{flag.id}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-1">
              {flag.element} — {flag.checkType} Check
            </p>
            <p className="text-xs text-muted-foreground">
              Sample <span className="font-mono text-primary">{flag.sampleId}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Flag details */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Observed", value: flag.observedValue.toFixed(4) },
              { label: "Expected", value: flag.expectedValue?.toFixed(4) ?? "—" },
              {
                label: "Deviation",
                value: flag.percentDeviation != null ? `${flag.percentDeviation.toFixed(1)}%` : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-center"
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {label}
                </p>
                <p className="mt-1 text-base font-bold text-foreground font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Action selector */}
          <div className="grid grid-cols-2 gap-2">
            {(["Approved", "Revised"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all
                  ${
                    action === a
                      ? a === "Approved"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500 bg-amber-500/10 text-amber-600"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
              >
                {a === "Approved" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                {a}
              </button>
            ))}
          </div>

          {/* Resolution notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Resolution Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder={
                action === "Approved"
                  ? "Explain why this result is acceptable…"
                  : "Describe the corrective action taken or re-analysis required…"
              }
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border px-6 py-4 bg-muted/10">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!resolution.trim()}
            className={`flex-1 rounded-md py-2 text-sm text-white font-semibold hover:opacity-90 transition disabled:opacity-40
              ${action === "Approved" ? "bg-emerald-600" : "bg-amber-500"}`}
          >
            {action === "Approved" ? "Approve Flag" : "Mark as Revised"}
          </button>
        </div>
      </div>
    </div>
  );
}
