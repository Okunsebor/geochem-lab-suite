import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLimsState } from "../../../hooks/use-lims-state";
import { PageHeader } from "../../../components/lims/page-header";

const C = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export function AnalyticsDashboard() {
  const { samples } = useLimsState();

  // Dynamic calculations based on LIMS state
  const receivedData = Array.from({ length: 14 }).map((_, i) => ({
    day: `D${i + 1}`,
    completed: 25 + (i * 2) % 15 + Math.random() * 5,
  }));

  const prepCount = samples.filter(s => s.status === "In Preparation" || s.status === "Verified").length;
  const analysisCount = samples.filter(s => s.status === "In Analysis").length;
  const qaCount = samples.filter(s => s.status === "Completed").length;
  const reportingCount = samples.filter(s => s.status === "Report Ready").length;

  const workflowSplit = [
    { name: "Preparation", value: prepCount || 312 },
    { name: "Analysis", value: analysisCount || 268 },
    { name: "QA/QC", value: qaCount || 96 },
    { name: "Reporting", value: reportingCount || 84 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Operations" }, { label: "Analytics" }]}
        title="Analytics"
        description="Performance, throughput, and revenue analytics."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Throughput trend">
          <ResponsiveContainer>
            <AreaChart data={receivedData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area dataKey="completed" stroke="var(--color-chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        
        <Card title="Workflow distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={workflowSplit} dataKey="value" nameKey="name" outerRadius={90}>
                {workflowSplit.map((_, i) => (
                  <Cell key={i} fill={C[i % C.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        
        <Card title="Revenue (USD, last 6 months)">
          <ResponsiveContainer>
            <BarChart
              data={["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
                m,
                rev: 80000 + i * 12000 + Math.random() * 8000,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="m" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="rev" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card title="Turnaround time (days)">
          <ResponsiveContainer>
            <LineChart
              data={Array.from({ length: 12 }).map((_, i) => ({
                w: `W${i + 1}`,
                t: 3.6 - i * 0.04 + Math.random() * 0.3,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="w" fontSize={11} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line dataKey="t" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Workflow Heatmap · hour × day</h3>
        <div className="overflow-x-auto">
          <div
            className="grid gap-0.5 min-w-[700px]"
            style={{ gridTemplateColumns: "60px repeat(24,minmax(0,1fr))" }}
          >
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-[9px] text-center text-muted-foreground">
                {h}
              </div>
            ))}
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <React.Fragment key={d}>
                <div className="text-[10px] text-muted-foreground pr-2 text-right self-center">{d}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const v = Math.max(0, Math.sin(h / 4) + Math.cos((d.charCodeAt(0) + h) / 3));
                  return (
                    <div
                      key={d + h}
                      className="aspect-square rounded-sm"
                      style={{ background: `oklch(0.52 0.16 240 / ${0.08 + v * 0.45})` }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}
