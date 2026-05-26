import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { samples, SAMPLE_STATUSES } from "@/lib/mock-data";
import { Download, Filter, Plus, Search, Upload, MoreHorizontal, ScanBarcode } from "lucide-react";

export const Route = createFileRoute("/app/samples/")({ component: SamplesPage });

function SamplesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
  const filtered = samples.filter((s) =>
    (status === "All" || s.status === status) &&
    (q === "" || s.id.toLowerCase().includes(q.toLowerCase()) || s.client.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Samples" }]}
        title="Samples"
        description="Manage every sample in the lab — registration to delivery."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"><Upload className="size-3.5" /> Import</button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"><Download className="size-3.5" /> Export</button>
            <Link to="/app/intake" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Plus className="size-3.5" /> Register</Link>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID or client…" className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm">
            <option>All</option>
            {SAMPLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted"><Filter className="size-3.5" /> Filters</button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted"><ScanBarcode className="size-3.5" /> Scan</button>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {samples.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-medium">
                <th className="w-8"><input type="checkbox" /></th>
                <th>Sample ID</th>
                <th>Client</th>
                <th>Project</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Technician</th>
                <th>Storage</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30 [&>td]:px-4 [&>td]:py-2.5">
                  <td><input type="checkbox" /></td>
                  <td className="font-mono text-xs"><Link to="/app/samples/$id" params={{ id: s.id }} className="text-primary hover:underline">{s.id}</Link></td>
                  <td>{s.client}</td>
                  <td className="text-muted-foreground">{s.project}</td>
                  <td>{s.type}</td>
                  <td><StatusBadge status={s.priority} /></td>
                  <td>{s.technician}</td>
                  <td className="font-mono text-xs">{s.location}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td><button className="rounded p-1 hover:bg-muted"><MoreHorizontal className="size-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>Page 1 of 4</span>
          <div className="flex gap-1">
            <button className="rounded border border-border px-2 py-1 hover:bg-muted">Prev</button>
            <button className="rounded border border-border bg-primary px-2 py-1 text-primary-foreground">1</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted">2</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted">3</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
