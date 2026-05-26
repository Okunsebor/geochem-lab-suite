import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { instruments } from "@/lib/mock-data";
import { Upload, Beaker } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/app/analysis")({ component: Analysis });

function Analysis() {
  const queue = Array.from({ length: 12 }).map((_, i) => ({
    id: `GCS-${24020 + i}`,
    element: ["Au","Cu-Pb-Zn","Multi-51E","REE","Multi-4-acid"][i % 5],
    instrument: instruments[i % instruments.length].id,
    eta: `${10 + (i*3) % 60}m`,
    progress: (i * 8) % 100,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Analysis" }]}
        title="Analysis"
        description="Instrument queues, raw data ingestion, and result validation."
        actions={<button className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Upload className="size-3.5" /> Upload raw data</button>}
      />

      {/* Instruments */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {instruments.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <Beaker className="size-5 text-primary" />
              <StatusBadge status={i.status} />
            </div>
            <p className="mt-3 text-sm font-semibold leading-tight">{i.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{i.id}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Queue</p>
                <p className="text-lg font-semibold">{i.queue}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Util</p>
                <p className="text-lg font-semibold">{i.util}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3"><h3 className="text-sm font-semibold">Active Queue</h3></div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                <th>Sample</th><th>Method</th><th>Instrument</th><th>Progress</th><th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                  <td className="font-mono text-xs text-primary">{q.id}</td>
                  <td>{q.element}</td>
                  <td className="font-mono text-xs">{q.instrument}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-32 rounded bg-muted overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${q.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{q.progress}%</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{q.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Method Library</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {[
              ["FA-AAS","Fire assay with AAS finish — Au"],
              ["ICP-MS-51E","51-element trace package"],
              ["ICP-OES 4-acid","Major + minor elements"],
              ["LECO C/S","Total carbon and sulfur"],
              ["AR-ICP-MS","Aqua regia digestion"],
            ].map((m) => (
              <li key={m[0]} className="rounded border border-border p-2.5">
                <p className="font-medium">{m[0]}</p>
                <p className="text-muted-foreground">{m[1]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Calibration & Drift</h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer>
            <BarChart data={Array.from({length:12}).map((_,i)=>({ run: `R${i+1}`, drift: ((i%5)-2)*0.4 + Math.random()*0.5 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="run" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="drift" fill="var(--color-chart-1)" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
