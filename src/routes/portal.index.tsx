import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/lims/stat-card";
import { StatusBadge } from "@/components/lims/status-badge";
import { samples, SAMPLE_STATUSES } from "@/lib/mock-data";
import { Beaker, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/portal/")({ component: PortalDash });

function PortalDash() {
  const mine = samples.slice(0, 8);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, Jane</h1>
        <p className="text-sm text-muted-foreground mt-1">Auric Mining Ltd · 12 active samples</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Samples" value="12" delta="+3" icon={<Beaker className="size-4"/>}/>
        <StatCard label="Avg Turnaround" value="3.4d" delta="-0.6d" icon={<Clock className="size-4"/>}/>
        <StatCard label="Ready to Download" value="4" icon={<CheckCircle2 className="size-4"/>}/>
        <StatCard label="Reports YTD" value="86" icon={<FileText className="size-4"/>}/>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">My Samples</h3>
            <Link to="/portal/submit" className="text-xs text-primary inline-flex items-center gap-1">Submit new <ArrowRight className="size-3"/></Link>
          </div>
          <div className="divide-y divide-border">
            {mine.map((s) => {
              const idx = SAMPLE_STATUSES.indexOf(s.status);
              return (
                <div key={s.id} className="p-4 hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs text-primary">{s.id}</p>
                      <p className="text-sm font-medium">{s.project}</p>
                    </div>
                    <StatusBadge status={s.status}/>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {SAMPLE_STATUSES.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded ${i <= idx ? "gradient-primary" : "bg-muted"}`}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Ready to download</h3>
          <ul className="mt-3 space-y-2">
            {Array.from({length:4}).map((_,i)=>(
              <li key={i} className="flex items-center justify-between rounded border border-border p-2.5 text-xs">
                <div>
                  <p className="font-mono text-primary">RPT-{2030+i}</p>
                  <p className="text-muted-foreground">{i+1}d ago · 6 pages</p>
                </div>
                <button className="rounded-md gradient-primary px-2.5 py-1 text-xs text-white">Download</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
