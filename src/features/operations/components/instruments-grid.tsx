import React from "react";
import { Activity, Wrench } from "lucide-react";
import { useLimsState } from "../../../hooks/use-lims-state";
import { PageHeader } from "../../../components/layout/PageHeader";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { toast } from "sonner";
import { Instrument } from "../../../types";

export function InstrumentsGrid() {
  const { instruments, toggleInstrumentStatus } = useLimsState();

  const handleMaintenance = (id: string, currentStatus: Instrument["status"]) => {
    const nextStatus: Instrument["status"] = currentStatus === "Maintenance" ? "Online" : "Maintenance";
    toggleInstrumentStatus(id, nextStatus);
    toast.success(`Instrument ${id} marked as ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Operations" }, { label: "Instruments" }]}
        title="Instruments"
        description="Monitor instrument health, queues, and calibration schedules."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {instruments.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{i.name}</p>
                <p className="text-xs text-muted-foreground font-mono font-medium">{i.id}</p>
              </div>
              <StatusBadge status={i.status} />
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-semibold">
              <div>
                <p className="text-muted-foreground">Queue</p>
                <p className="text-base font-bold text-foreground mt-0.5">{i.queue}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Utilization</p>
                <p className="text-base font-bold text-foreground mt-0.5">{i.util}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last calibrated</p>
                <p className="text-base font-bold text-foreground mt-0.5">{i.lastCalibrated || "14h ago"}</p>
              </div>
            </div>
            
            <div className="mt-4 h-1.5 rounded bg-muted overflow-hidden">
              <div className="h-full gradient-primary" style={{ width: `${i.util}%` }} />
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toast.info(`Viewing calibration logs for ${i.id}`)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Activity className="size-3.5 text-muted-foreground" /> View logs
              </button>
              <button
                onClick={() => handleMaintenance(i.id, i.status)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Wrench className="size-3.5 text-muted-foreground" />
                {i.status === "Maintenance" ? "Complete Cal" : "Maintenance"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
