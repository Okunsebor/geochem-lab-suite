import React from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/layout/PageHeader";
import { useQaqc } from "../../hooks/use-qaqc";
import { QaqcStatsBar } from "./components/qaqc-stats-bar";
import { CrmTrendChart, DuplicateChart } from "./components/crm-trend-chart";
import { FlagTable } from "./components/flag-table";

export function QaqcFeature() {
  const {
    qaFlags, loadingFlags,
    passRate, openFlagCount, crmOutOfSpec, avgDuplicateSpread,
    resolveFlag, dismissFlag,
  } = useQaqc();

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Workspace" }, { label: "QA / QC" }]}
        title="QA / QC Monitoring"
        description="Duplicates, blanks, CRMs and anomaly flags across the lab."
      />

      {/* Live KPI Stats */}
      <QaqcStatsBar
        passRate={passRate}
        openFlagCount={openFlagCount}
        crmOutOfSpec={crmOutOfSpec}
        avgDuplicateSpread={avgDuplicateSpread}
      />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CrmTrendChart qaFlags={qaFlags} />
        <DuplicateChart qaFlags={qaFlags} threshold={10} />
      </div>

      {/* Flag table */}
      {loadingFlags ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-3 rounded-xl border border-border bg-card">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading QA flags…</span>
        </div>
      ) : (
        <FlagTable
          flags={qaFlags}
          onResolve={(flagId, resolution, action) => {
            resolveFlag(flagId, resolution, action);
            toast.success(`Flag ${flagId} ${action.toLowerCase()}`, {
              description: resolution.slice(0, 80),
            });
          }}
          onDismiss={(flagId) => {
            dismissFlag(flagId);
            toast.info(`Flag ${flagId} dismissed`);
          }}
        />
      )}
    </div>
  );
}
