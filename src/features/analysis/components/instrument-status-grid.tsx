import React, { useState } from "react";
import { Beaker, Plus, Settings } from "lucide-react";
import { Instrument, Sample } from "../../../types";
import { StatusBadge } from "../../../components/lims/status-badge";
import { AnalyticalRun } from "../../../types";

interface InstrumentStatusGridProps {
  instruments: Instrument[];
  runs: AnalyticalRun[];
  inAnalysisSamples: Sample[];
  onAssign: (instrumentId: string) => void;
}

const STATUS_COLORS: Record<Instrument["status"], string> = {
  Online:      "hsl(158 64% 48%)",
  Maintenance: "hsl(38 95% 55%)",
  Calibrating: "hsl(210 90% 55%)",
};

export function InstrumentStatusGrid({
  instruments, runs, inAnalysisSamples, onAssign,
}: InstrumentStatusGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {instruments.map((inst) => {
        const liveQueue  = runs.filter((r) => r.instrumentId === inst.id && (r.status === "Queued" || r.status === "Running")).length;
        const queueCount = liveQueue || inst.queue;
        const color      = STATUS_COLORS[inst.status];
        const isDue      = inst.lastCalibrated &&
          new Date(inst.lastCalibrated).getTime() < Date.now() - 20 * 3600000;

        return (
          <div
            key={inst.id}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all hover:shadow-sm"
            style={{ borderTopColor: color, borderTopWidth: 3 }}
          >
            <div className="flex items-start justify-between">
              <div
                className="size-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <Beaker className="size-5" style={{ color }} />
              </div>
              <StatusBadge status={inst.status} />
            </div>

            <p className="mt-3 text-sm font-semibold leading-tight text-foreground">{inst.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{inst.id}</p>

            {isDue && (
              <p className="mt-1 text-[10px] font-semibold text-amber-500 flex items-center gap-1">
                <Settings className="size-3" /> Calibration due
              </p>
            )}

            <div className="mt-3 space-y-1.5">
              {/* Queue + Util bars */}
              <div className="flex items-end justify-between text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Queue</p>
                  <p className="text-base font-bold text-foreground">{queueCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Util</p>
                  <p className="text-base font-bold text-foreground">{inst.util}%</p>
                </div>
              </div>

              {/* Util bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${inst.util}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* Assign button */}
            {inst.status === "Online" && inAnalysisSamples.length > 0 && (
              <button
                onClick={() => onAssign(inst.id)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <Plus className="size-3" /> Assign Sample
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
