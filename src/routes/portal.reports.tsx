import { createFileRoute } from "@tanstack/react-router";
import { StatusBadge } from "@/components/lims/status-badge";
import { reports } from "@/lib/mock-data";
import { Download } from "lucide-react";

export const Route = createFileRoute("/portal/reports")({ component: PortalReports });

function PortalReports() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Reports</h1>
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium"><th>Report</th><th>Sample</th><th>Pages</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {reports.map(r=>(
              <tr key={r.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                <td className="font-mono text-xs text-primary">{r.id}</td>
                <td className="font-mono text-xs">{r.sample}</td>
                <td className="text-muted-foreground">{r.pages}</td>
                <td><StatusBadge status={r.status}/></td>
                <td className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><button className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Download className="size-3"/> PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
