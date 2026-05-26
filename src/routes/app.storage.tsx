import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/app/storage")({ component: Storage });

function Storage() {
  const racks = ["A","B","C","D","E","F"];
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Operations"},{label:"Storage"}]} title="Storage Management" description="Physical sample storage map and capacity." />
      <div className="grid gap-4 lg:grid-cols-3">
        {racks.map((r) => (
          <div key={r} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold inline-flex items-center gap-2"><Boxes className="size-4 text-primary" /> Rack {r}</h3>
              <span className="text-xs text-muted-foreground">{8 + (r.charCodeAt(0)%5)}/12</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {Array.from({length:12}).map((_,i) => {
                const filled = (i + r.charCodeAt(0)) % 3 !== 0;
                return <div key={i} className={`aspect-square rounded text-[10px] grid place-items-center ${filled ? "gradient-primary text-white" : "border border-dashed border-border text-muted-foreground"}`}>{filled ? `S${i+1}` : ""}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
