import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { instruments } from "@/lib/mock-data";
import { Activity, Wrench } from "lucide-react";

export const Route = createFileRoute("/app/instruments")({ component: Instr });

function Instr() {
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: "Operations" }, { label: "Instruments" }]} title="Instruments" description="Monitor instrument health, queues, and calibration schedules." />
      <div className="grid gap-4 lg:grid-cols-2">
        {instruments.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{i.id}</p>
              </div>
              <StatusBadge status={i.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div><p className="text-muted-foreground">Queue</p><p className="text-base font-semibold">{i.queue}</p></div>
              <div><p className="text-muted-foreground">Utilization</p><p className="text-base font-semibold">{i.util}%</p></div>
              <div><p className="text-muted-foreground">Last calibrated</p><p className="text-base font-semibold">14h</p></div>
            </div>
            <div className="mt-4 h-1.5 rounded bg-muted overflow-hidden">
              <div className="h-full gradient-primary" style={{ width: `${i.util}%` }} />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center justify-center gap-1.5"><Activity className="size-3.5" /> View logs</button>
              <button className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center justify-center gap-1.5"><Wrench className="size-3.5" /> Maintenance</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
