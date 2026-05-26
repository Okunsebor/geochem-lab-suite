import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { samples } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/preparation")({ component: Preparation });

const stages = ["Drying", "Crushing", "Splitting", "Pulverizing"] as const;

function Preparation() {
  const byStage = stages.map((stage, i) => ({
    stage,
    items: samples.slice(i * 4, i * 4 + 5),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Preparation" }]}
        title="Preparation Workflow"
        description="Kanban board of all samples in the preparation pipeline."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Plus className="size-3.5" /> Assign batch</button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {byStage.map((col) => (
          <div key={col.stage} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">{col.stage}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{col.items.length}</span>
            </div>
            <ul className="space-y-2 p-3">
              {col.items.map((s) => (
                <li key={s.id} className="rounded-lg border border-border bg-background p-3 hover:border-primary/40 cursor-grab">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">{s.id}</span>
                    <StatusBadge status={s.priority} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-tight">{s.client}</p>
                  <p className="text-xs text-muted-foreground">{s.project}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.technician}</span>
                    <div className="flex -space-x-1">
                      {["JC-400","SP-2","PA-1"].slice(0, (col.items.indexOf(s) % 3) + 1).map((eq) => (
                        <span key={eq} className="rounded border border-border bg-muted px-1 text-[10px]">{eq}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 h-1 rounded bg-muted overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${20 + (col.items.indexOf(s) * 18) % 80}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Technician Activity</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr className="[&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>Time</th><th>Technician</th><th>Sample</th><th>Stage</th><th>Equipment</th><th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["10:42","E. Okafor","GCS-24012","Pulverizing","Pulverizer A-2","12m"],
              ["10:18","K. Nakamura","GCS-24008","Crushing","JC-400","18m"],
              ["09:55","S. Patel","GCS-24005","Drying","Oven A","2h"],
              ["09:34","M. Rivera","GCS-24001","Splitting","Riffle Splitter","6m"],
            ].map((r,i) => (
              <tr key={i} className="border-b border-border last:border-0 [&>td]:py-2.5">
                <td className="font-mono text-xs">{r[0]}</td>
                <td>{r[1]}</td>
                <td className="font-mono text-xs text-primary">{r[2]}</td>
                <td>{r[3]}</td>
                <td className="text-muted-foreground">{r[4]}</td>
                <td className="text-muted-foreground">{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
