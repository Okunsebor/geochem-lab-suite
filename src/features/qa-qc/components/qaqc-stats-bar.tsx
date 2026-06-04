import React from "react";
import { ShieldCheck, AlertTriangle, Beaker, Activity } from "lucide-react";

interface QaqcStatsBarProps {
  passRate: number;
  openFlagCount: number;
  crmOutOfSpec: number;
  avgDuplicateSpread: number | null;
}

export function QaqcStatsBar({
  passRate,
  openFlagCount,
  crmOutOfSpec,
  avgDuplicateSpread,
}: QaqcStatsBarProps) {
  const stats = [
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      icon: ShieldCheck,
      color:
        passRate >= 95 ? "hsl(158 64% 48%)" : passRate >= 85 ? "hsl(38 95% 55%)" : "hsl(0 84% 55%)",
      bg:
        passRate >= 95
          ? "bg-emerald-500/10"
          : passRate >= 85
            ? "bg-amber-500/10"
            : "bg-rose-500/10",
    },
    {
      label: "Open Flags",
      value: String(openFlagCount),
      icon: AlertTriangle,
      color:
        openFlagCount === 0
          ? "hsl(158 64% 48%)"
          : openFlagCount <= 3
            ? "hsl(38 95% 55%)"
            : "hsl(0 84% 55%)",
      bg:
        openFlagCount === 0
          ? "bg-emerald-500/10"
          : openFlagCount <= 3
            ? "bg-amber-500/10"
            : "bg-rose-500/10",
    },
    {
      label: "CRMs Out-of-Spec",
      value: String(crmOutOfSpec),
      icon: Beaker,
      color: crmOutOfSpec === 0 ? "hsl(158 64% 48%)" : "hsl(0 84% 55%)",
      bg: crmOutOfSpec === 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
    },
    {
      label: "Avg Duplicate Spread",
      value: avgDuplicateSpread != null ? `${avgDuplicateSpread}%` : "—",
      icon: Activity,
      color:
        avgDuplicateSpread == null || avgDuplicateSpread <= 10
          ? "hsl(210 90% 55%)"
          : "hsl(38 95% 55%)",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {s.label}
              </p>
              <div className={`size-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <Icon className="size-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
