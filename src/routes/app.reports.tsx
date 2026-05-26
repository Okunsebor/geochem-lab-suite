import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { reports } from "@/lib/mock-data";
import { Download, Eye, FileText, Check, X } from "lucide-react";

export const Route = createFileRoute("/app/reports")({ component: Reports });

function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Reports" }]}
        title="Reports"
        description="Generate, approve and deliver certified analytical reports."
        actions={<button className="rounded-md gradient-primary px-3 py-1.5 text-sm text-white">Generate report</button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">All Reports</h3>
            <div className="flex gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
              {["All","Pending","Approved","Delivered"].map((t,i) => (
                <button key={t} className={i === 0 ? "rounded bg-primary px-2 py-0.5 text-primary-foreground" : "px-2 py-0.5 text-muted-foreground"}>{t}</button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                <th>Report</th><th>Sample</th><th>Client</th><th>Pages</th><th>Created</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                  <td className="font-mono text-xs text-primary">{r.id}</td>
                  <td className="font-mono text-xs">{r.sample}</td>
                  <td>{r.client}</td>
                  <td className="text-muted-foreground">{r.pages}</td>
                  <td className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="rounded p-1 hover:bg-muted" title="Preview"><Eye className="size-3.5" /></button>
                      <button className="rounded p-1 hover:bg-muted" title="Download"><Download className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PDF preview card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Preview · RPT-2041</h3>
            <StatusBadge status="Pending Approval" />
          </div>
          <div className="p-4 bg-muted/30">
            <div className="mx-auto aspect-[3/4] w-full max-w-xs rounded bg-white shadow-sm p-4 text-[8px] text-black space-y-2">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-bold">GeoChem Suite</span>
                <span>Certificate of Analysis</span>
              </div>
              <p><b>Report:</b> RPT-2041</p>
              <p><b>Client:</b> Auric Mining Ltd</p>
              <p><b>Sample:</b> GCS-24002</p>
              <table className="w-full mt-1">
                <thead><tr className="border-b"><th className="text-left">Elem</th><th>Val</th><th>Unit</th></tr></thead>
                <tbody>
                  {["Au 2.41 g/t","Ag 18.2 g/t","Cu 1.24 %","Pb 0.34 %"].map((l)=>(<tr key={l} className="border-b"><td colSpan={3}>{l}</td></tr>))}
                </tbody>
              </table>
              <p className="pt-2 italic">Approved by: ____________</p>
            </div>
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-xs text-white"><Check className="size-3.5" /> Approve</button>
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"><X className="size-3.5" /> Reject</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold inline-flex items-center gap-2"><FileText className="size-4" /> Archived Reports (last 30 days)</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="rounded border border-border p-2.5 hover:border-primary/40">
              <p className="font-mono text-primary">RPT-{2010+i}</p>
              <p className="text-muted-foreground mt-0.5">Pacific Resources</p>
              <p className="text-muted-foreground">Delivered · {i+2}d ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
