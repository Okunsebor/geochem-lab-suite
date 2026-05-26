import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { samples, SAMPLE_STATUSES } from "@/lib/mock-data";
import { ArrowLeft, QrCode, Printer, MessageSquare, Edit3, FileText } from "lucide-react";

export const Route = createFileRoute("/app/samples/$id")({ component: SampleDetail });

function SampleDetail() {
  const { id } = Route.useParams();
  const sample = samples.find((s) => s.id === id) ?? samples[0];
  const currentIdx = SAMPLE_STATUSES.indexOf(sample.status);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "Samples" }, { label: sample.id }]}
        title={sample.id}
        description={`${sample.client} · ${sample.project}`}
        actions={
          <>
            <Link to="/app/samples" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"><ArrowLeft className="size-3.5" /> Back</Link>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"><Printer className="size-3.5" /> Print label</button>
            <button className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white"><Edit3 className="size-3.5" /> Update status</button>
          </>
        }
      />

      {/* Workflow */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Workflow Progress</h3>
          <StatusBadge status={sample.status} />
        </div>
        <ol className="flex items-center w-full">
          {SAMPLE_STATUSES.map((st, i) => {
            const done = i <= currentIdx;
            return (
              <li key={st} className={`flex-1 flex items-center ${i < SAMPLE_STATUSES.length - 1 ? "after:content-[''] after:flex-1 after:h-0.5 after:mx-2 " + (i < currentIdx ? "after:bg-primary" : "after:bg-border") : ""}`}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`grid size-7 place-items-center rounded-full text-[10px] font-semibold ${done ? "gradient-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <span className={`text-[10px] ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{st}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Sample Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Client", sample.client], ["Project", sample.project],
                ["Type", sample.type], ["Weight", sample.weight],
                ["Storage", sample.location], ["Priority", sample.priority],
                ["Technician", sample.technician], ["Received", new Date(sample.receivedAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Chain of custody */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Chain of Custody</h3>
            <ol className="relative ml-3 border-l-2 border-border space-y-4">
              {[
                ["Received at intake", "S. Patel", "2d ago"],
                ["Verified & weighed", "M. Rivera", "2d ago"],
                ["Moved to drying oven A2", "K. Nakamura", "1d ago"],
                ["Crushed at JC-400", "E. Okafor", "18h ago"],
                ["Pulverized · 95% passing", "E. Okafor", "12h ago"],
                ["Assigned to ICP-MS-01", "System", "4h ago"],
              ].map(([w, who, when], i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 grid size-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm">{w}</p>
                  <p className="text-xs text-muted-foreground">{who} · {when}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Analytical Results</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-left">
                  <th>Element</th><th>Value</th><th>Unit</th><th>Method</th><th>QA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Au","2.41","g/t","FA-AAS","Pass"],
                  ["Ag","18.2","g/t","ICP-MS","Pass"],
                  ["Cu","1.24","%","ICP-OES","Pass"],
                  ["Pb","0.34","%","ICP-OES","Pass"],
                  ["Zn","2.08","%","ICP-OES","Flag"],
                  ["As","82","ppm","ICP-MS","Pass"],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-border last:border-0 [&>td]:px-2 [&>td]:py-2">
                    <td className="font-medium">{r[0]}</td><td className="font-mono">{r[1]}</td><td className="text-muted-foreground">{r[2]}</td><td className="text-muted-foreground">{r[3]}</td>
                    <td><StatusBadge status={r[4] === "Pass" ? "Completed" : "Pending Approval"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="mx-auto grid size-32 place-items-center rounded-lg border border-border bg-muted/30">
              <QrCode className="size-16 text-foreground" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground font-mono">{sample.id}</p>
            <button className="mt-3 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">Reprint barcode</button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Linked Documents</h3>
            <ul className="space-y-2 text-xs">
              {["Intake Form.pdf","Field Notes.pdf","COC-118.pdf"].map((f) => (
                <li key={f} className="flex items-center justify-between rounded border border-border p-2">
                  <span className="inline-flex items-center gap-2"><FileText className="size-3.5 text-primary" /> {f}</span>
                  <button className="text-primary hover:underline">View</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><MessageSquare className="size-4" /> Notes</h3>
            <textarea placeholder="Add a note…" className="mt-3 w-full rounded-md border border-input bg-background p-2 text-sm min-h-[80px]" />
            <button className="mt-2 w-full rounded-md gradient-primary px-3 py-1.5 text-xs text-white">Post note</button>
          </div>
        </div>
      </div>
    </div>
  );
}
