import React from "react";
import { Activity } from "lucide-react";
import { PrepActivityEntry, STAGE_COLOR } from "../../../hooks/use-preparation";
import { PrepStage } from "../../../types";

interface PrepActivityLogProps {
  activity: PrepActivityEntry[];
}

const ACTION_LABELS: Record<PrepActivityEntry["action"], { label: string; color: string }> = {
  Enrolled: { label: "Enrolled", color: "text-primary" },
  Started: { label: "Started", color: "text-amber-500" },
  Completed: { label: "Completed", color: "text-emerald-500" },
  Skipped: { label: "Skipped", color: "text-muted-foreground" },
  Held: { label: "On Hold", color: "text-rose-500" },
  Resumed: { label: "Resumed", color: "text-sky-500" },
};

// Seed entries shown when no real activity yet
const SEED_ACTIVITY: PrepActivityEntry[] = [
  {
    id: "s1",
    time: "10:42",
    technician: "E. Okafor",
    sampleId: "GCS-24012",
    stage: "Pulverizing",
    action: "Completed",
    equipment: "Pulverizer A-2",
    duration: 12,
  },
  {
    id: "s2",
    time: "10:18",
    technician: "K. Nakamura",
    sampleId: "GCS-24008",
    stage: "Crushing",
    action: "Completed",
    equipment: "JC-400",
    duration: 18,
  },
  {
    id: "s3",
    time: "09:55",
    technician: "S. Patel",
    sampleId: "GCS-24005",
    stage: "Drying",
    action: "Started",
    equipment: "Oven A",
  },
  {
    id: "s4",
    time: "09:34",
    technician: "M. Rivera",
    sampleId: "GCS-24001",
    stage: "Splitting",
    action: "Completed",
    equipment: "Riffle Splitter",
    duration: 6,
  },
  {
    id: "s5",
    time: "08:51",
    technician: "J. Chen",
    sampleId: "GCS-24003",
    stage: "Crushing",
    action: "Started",
    equipment: "JC-401",
  },
  {
    id: "s6",
    time: "08:20",
    technician: "A. Volkov",
    sampleId: "GCS-24000",
    stage: "Drying",
    action: "Enrolled",
  },
];

export function PrepActivityLog({ activity }: PrepActivityLogProps) {
  const rows = activity.length > 0 ? activity : SEED_ACTIVITY;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-muted/20">
        <Activity className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Technician Activity Log</h3>
        {activity.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">
            Live
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold">
              <th>Time</th>
              <th>Technician</th>
              <th>Sample</th>
              <th>Stage</th>
              <th>Action</th>
              <th>Equipment</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const actionMeta = ACTION_LABELS[r.action];
              const stageColor = STAGE_COLOR[r.stage as PrepStage];
              return (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <td className="font-mono text-xs text-muted-foreground">{r.time}</td>
                  <td className="font-medium text-foreground">{r.technician}</td>
                  <td>
                    <span className="font-mono text-xs font-semibold text-primary">
                      {r.sampleId}
                    </span>
                  </td>
                  <td>
                    <span
                      className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
                    >
                      {r.stage}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold ${actionMeta.color}`}>
                      {actionMeta.label}
                    </span>
                  </td>
                  <td className="text-muted-foreground text-xs">{r.equipment || "—"}</td>
                  <td className="text-muted-foreground text-xs">
                    {r.duration != null ? `${r.duration}m` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
