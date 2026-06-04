import React from "react";
import { Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AnalyticalRun, RunStatus } from "../../../types";
import { StatusBadge } from "../../../components/shared/StatusBadge";

interface AnalysisQueueTableProps {
  runs: AnalyticalRun[];
  onStart: (runId: string) => void;
  onComplete: (runId: string) => void;
  onFail: (runId: string) => void;
}

const RUN_STATUS_META: Record<RunStatus, { label: string; color: string; bg: string }> = {
  Queued: { label: "Queued", color: "text-muted-foreground", bg: "bg-muted" },
  Running: { label: "Running", color: "text-amber-600", bg: "bg-amber-500/10" },
  Complete: { label: "Complete", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  Failed: { label: "Failed", color: "text-rose-600", bg: "bg-rose-500/10" },
};

// Seed rows shown when no real runs exist
const SEED_RUNS: AnalyticalRun[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `RUN-${10001 + i}`,
  sampleId: `GCS-${24020 + i}`,
  instrumentId: ["ICP-MS-01", "XRF-02", "AAS-04", "LECO-05", "ICP-MS-01"][i % 5],
  method: ["FA-AAS", "ICP-MS-51E", "ICP-OES-4A", "LECO-CS", "AR-ICP-MS"][i % 5],
  analystName: ["E. Okafor", "K. Nakamura", "S. Patel", "M. Rivera"][i % 4],
  status: (
    [
      "Queued",
      "Running",
      "Complete",
      "Queued",
      "Running",
      "Complete",
      "Failed",
      "Queued",
    ] as RunStatus[]
  )[i],
  results: [],
}));

function elapsedSince(iso?: string): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function AnalysisQueueTable({ runs, onStart, onComplete, onFail }: AnalysisQueueTableProps) {
  const rows = runs.length > 0 ? runs : SEED_RUNS;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">Active Analysis Queue</h3>
        <span className="text-xs text-muted-foreground">{rows.length} runs</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
            <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold">
              <th>Run ID</th>
              <th>Sample</th>
              <th>Method</th>
              <th>Instrument</th>
              <th>Analyst</th>
              <th>Status</th>
              <th>Started</th>
              <th>Results</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = RUN_STATUS_META[r.status];
              return (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-2.5 font-medium hover:bg-muted/20 transition-colors"
                >
                  <td className="font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="font-mono text-xs text-primary font-semibold">{r.sampleId}</td>
                  <td className="text-xs">{r.method}</td>
                  <td className="font-mono text-xs">{r.instrumentId}</td>
                  <td className="text-xs text-muted-foreground">{r.analystName}</td>
                  <td>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> {elapsedSince(r.startedAt)}
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {r.results.length > 0 ? (
                      <span className="text-emerald-600 font-semibold">
                        {r.results.length} results
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {r.status === "Queued" && (
                        <button
                          onClick={() => onStart(r.id)}
                          title="Start run"
                          className="rounded p-1 hover:bg-amber-500/10 text-amber-600 transition"
                        >
                          <Play className="size-3.5" />
                        </button>
                      )}
                      {r.status === "Running" && (
                        <>
                          <button
                            onClick={() => onComplete(r.id)}
                            title="Mark complete"
                            className="rounded p-1 hover:bg-emerald-500/10 text-emerald-600 transition"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => onFail(r.id)}
                            title="Mark failed"
                            className="rounded p-1 hover:bg-rose-500/10 text-rose-600 transition"
                          >
                            <XCircle className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
