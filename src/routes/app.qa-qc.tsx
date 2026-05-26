import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { StatusBadge } from "@/components/lims/status-badge";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export const Route = createFileRoute("/app/qa-qc")({ component: QA });

function QA() {
  const data = Array.from({length:20}).map((_,i)=>({ idx: i, value: 2.4 + Math.sin(i/2)*0.08 + (Math.random()-0.5)*0.1 }));
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "QA / QC" }]}
        title="QA / QC Monitoring"
        description="Duplicates, blanks, CRMs and anomaly flags across the lab."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Pass Rate", v: "98.6%", c: "success" },
          { l: "Open Flags", v: "4", c: "warning" },
          { l: "CRMs Out-of-Spec", v: "1", c: "destructive" },
          { l: "Avg Duplicate Spread", v: "3.1%", c: "info" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</p>
            <p className="mt-2 text-3xl font-semibold">{k.v}</p>
            <ShieldCheck className={`mt-2 size-4 text-${k.c}`} />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">CRM Trend — OREAS 234 (Au g/t)</h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="idx" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis domain={[2.1, 2.7]} stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={2.55} stroke="var(--color-destructive)" strokeDasharray="3 3" />
              <ReferenceLine y={2.25} stroke="var(--color-destructive)" strokeDasharray="3 3" />
              <ReferenceLine y={2.4} stroke="var(--color-success)" />
              <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3"><h3 className="text-sm font-semibold inline-flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Open Anomaly Flags</h3></div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>Flag ID</th><th>Sample</th><th>Element</th><th>Check Type</th><th>Severity</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["QF-441","GCS-24004","Au","Duplicate","High","Pending Approval"],
              ["QF-440","GCS-24016","Cu","Blank","Medium","Pending Approval"],
              ["QF-438","GCS-24008","Zn","CRM","Low","Approved"],
              ["QF-435","GCS-24001","Pb","Duplicate","Medium","Revised"],
            ].map((r) => (
              <tr key={r[0]} className="border-t border-border [&>td]:px-4 [&>td]:py-2.5">
                <td className="font-mono text-xs">{r[0]}</td>
                <td className="font-mono text-xs text-primary">{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
                <td><StatusBadge status={r[4] === "High" ? "Rush" : r[4] === "Medium" ? "High" : "Low"} /></td>
                <td><StatusBadge status={r[5]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
