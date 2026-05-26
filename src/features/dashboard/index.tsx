import React from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Beaker,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Plus,
  AlertTriangle,
  Clock,
  Users2,
  FileCheck2,
} from "lucide-react";

import { useLimsState } from "../../hooks/use-lims-state";
import { PageHeader } from "../../components/lims/page-header";
import { StatCard } from "../../components/lims/stat-card";
import { StatusBadge } from "../../components/lims/status-badge";
import { throughput } from "../../lib/mock-data";

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export function DashboardFeature() {
  const { samples, instruments, activity, notifications } = useLimsState();

  // Compute actual dynamic KPIs
  const activeSamples = samples.filter((s) => s.status !== "Completed" && s.status !== "Report Ready").length;
  
  // Static KPI structure synced to state
  const kpis = [
    { label: "Active Samples", value: activeSamples.toString(), delta: "+12.4%", trend: "up" as const, icon: FlaskConical },
    { label: "Avg. Turnaround", value: "3.2d", delta: "-0.4d", trend: "up" as const, icon: Clock },
    { label: "QA/QC Pass Rate", value: "98.6%", delta: "+0.8%", trend: "up" as const, icon: ShieldCheck },
    { label: "Overdue", value: "7", delta: "-3", trend: "up" as const, icon: AlertTriangle },
  ];

  const recent = samples.slice(0, 6);

  // Compute actual workflow splits
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
        crumbs={[{ label: "Workspace" }, { label: "Dashboard" }]}
        title="Operational Dashboard"
        description="Real-time view of lab throughput, QA performance, and pending actions."
        actions={
          <>
            <Link
              to="/app/intake"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted font-medium transition cursor-pointer"
            >
              <Plus className="size-3.5" /> New intake
            </Link>
            <Link
              to="/app/reports"
              className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-sm text-white font-medium hover:opacity-90 shadow-sm transition cursor-pointer"
            >
              <FileCheck2 className="size-3.5" /> Approve reports
            </Link>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatCard
                label={k.label}
                value={k.value}
                delta={k.delta}
                trend={k.trend}
                icon={<Icon className="size-4" />}
                hint="vs last 14d"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Chart Panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Throughput</h3>
              <p className="text-xs text-muted-foreground">Samples received vs completed · 14 days</p>
            </div>
            <div className="flex gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
              {["14d", "30d", "90d"].map((p, i) => (
                <button
                  key={p}
                  className={
                    i === 0
                      ? "rounded bg-primary px-2 py-0.5 text-primary-foreground font-medium"
                      : "px-2 py-0.5 text-muted-foreground"
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="received" stroke="var(--color-chart-1)" fill="url(#r)" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" stroke="var(--color-chart-2)" fill="url(#c)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Workflow Split</h3>
          <p className="text-xs text-muted-foreground">Samples by stage</p>
          <div className="mt-2 h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={workflowSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {workflowSplit.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables and Alerts split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-card">
            <h3 className="text-sm font-semibold">Recent Samples</h3>
            <Link
              to="/app/samples"
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-medium"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr className="[&>th]:px-5 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium border-b border-border">
                  <th>Sample</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Tech</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr
                    key={s.id}
                    className="[&>td]:px-5 [&>td]:py-2.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="font-mono text-xs">
                      <Link to="/app/samples/$id" params={{ id: s.id }} className="text-primary hover:underline font-medium">
                        {s.id}
                      </Link>
                    </td>
                    <td>{s.client}</td>
                    <td className="text-muted-foreground">{s.type}</td>
                    <td className="text-muted-foreground">{s.technician}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Alerts & Notifications</h3>
          <ul className="mt-3 space-y-2 max-h-[290px] overflow-y-auto">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="flex gap-2 rounded-lg border border-border p-2.5 text-xs bg-card">
                <span
                  className={`mt-0.5 size-1.5 shrink-0 rounded-full ${
                    n.kind === "alert" ? "bg-destructive" : n.kind === "approval" ? "bg-warning" : "bg-info"
                  }`}
                />
                <div className="flex-1">
                  <p className="leading-snug font-medium text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{n.time} ago</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subpanels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Instruments
          </h3>
          <ul className="mt-3 space-y-2">
            {instruments.slice(0, 4).map((i) => (
              <li key={i.id} className="rounded-lg border border-border p-2.5 text-xs bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{i.name}</span>
                  <StatusBadge status={i.status} />
                </div>
                <div className="mt-2 h-1 rounded bg-muted overflow-hidden">
                  <div className="h-full gradient-primary" style={{ width: `${i.util}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Queue {i.queue} · Util {i.util}%
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2">
            <Beaker className="size-4 text-primary" /> QA / QC Trend
          </h3>
          <div className="mt-3 h-40">
            <ResponsiveContainer>
              <BarChart
                data={throughput.slice(0, 7).map((d, i) => ({
                  day: d.day,
                  pass: 92 + (i % 5),
                  fail: (i % 5) * 1.5,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="pass" stackId="a" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="fail" stackId="a" fill="var(--color-chart-4)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2">
            <Users2 className="size-4 text-primary" /> Activity Feed
          </h3>
          <ul className="mt-3 space-y-3 max-h-[170px] overflow-y-auto">
            {activity.slice(0, 5).map((a, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold">
                  {a.who
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-semibold text-foreground">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-mono text-primary font-medium">{a.target}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
