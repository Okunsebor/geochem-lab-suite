import React, { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Scatter,
  ScatterChart,
} from "recharts";
import { QaFlag } from "../../../types";

// ─── CRM Trend Chart ─────────────────────────────────────────────────────────

interface CrmTrendChartProps {
  qaFlags: QaFlag[];
}

export function CrmTrendChart({ qaFlags }: CrmTrendChartProps) {
  // Extract CRM flags and build time-series (or generate plausible demo data)
  const crmData = useMemo(() => {
    const crmFlags = qaFlags
      .filter((f) => f.checkType === "CRM")
      .slice(0, 20)
      .map((f, i) => ({
        idx: i,
        value: f.observedValue,
        certified: f.expectedValue ?? 2.4,
        deviation: f.percentDeviation ?? 0,
      }))
      .reverse();

    if (crmFlags.length < 5) {
      // Generate plausible CRM trend data for demo
      return Array.from({ length: 20 }).map((_, i) => ({
        idx: i,
        value: 2.4 + Math.sin(i / 2) * 0.08 + (Math.random() - 0.5) * 0.06,
        certified: 2.4,
        deviation: 0,
      }));
    }
    return crmFlags;
  }, [qaFlags]);

  const certified = crmData[0]?.certified ?? 2.4;
  const upperLimit = certified * 1.05;
  const lowerLimit = certified * 0.95;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">CRM Trend — OREAS 234 (Au g/t)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Certified: <strong>{certified.toFixed(3)}</strong> g/t · Tolerance: ±5%
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500/70 inline-block" /> Upper/Lower limit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Certified value
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={crmData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="idx"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              label={{ value: "Run", position: "insideBottomRight", offset: -5, fontSize: 11 }}
            />
            <YAxis
              domain={[lowerLimit * 0.98, upperLimit * 1.02]}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [v.toFixed(3), "Au g/t"]}
            />
            <ReferenceLine
              y={upperLimit}
              stroke="hsl(0 84% 60%)"
              strokeDasharray="4 3"
              label={{
                value: `+5% (${upperLimit.toFixed(3)})`,
                fill: "hsl(0 84% 60%)",
                fontSize: 10,
                position: "right",
              }}
            />
            <ReferenceLine
              y={lowerLimit}
              stroke="hsl(0 84% 60%)"
              strokeDasharray="4 3"
              label={{
                value: `-5% (${lowerLimit.toFixed(3)})`,
                fill: "hsl(0 84% 60%)",
                fontSize: 10,
                position: "right",
              }}
            />
            <ReferenceLine
              y={certified}
              stroke="hsl(158 64% 48%)"
              label={{
                value: `Cert. (${certified.toFixed(3)})`,
                fill: "hsl(158 64% 48%)",
                fontSize: 10,
                position: "left",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const outOfSpec = payload.value > upperLimit || payload.value < lowerLimit;
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={cx}
                    cy={cy}
                    r={outOfSpec ? 5 : 3}
                    fill={outOfSpec ? "hsl(0 84% 60%)" : "var(--color-chart-1)"}
                    stroke="var(--color-card)"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Duplicate Spread Chart ───────────────────────────────────────────────────

interface DuplicateChartProps {
  qaFlags: QaFlag[];
  threshold?: number;
}

export function DuplicateChart({ qaFlags, threshold = 10 }: DuplicateChartProps) {
  const dupData = useMemo(() => {
    const dups = qaFlags
      .filter((f) => f.checkType === "Duplicate")
      .map((f, i) => ({
        name: f.sampleId,
        rpd: f.percentDeviation ?? 0,
        element: f.element,
        status: f.status,
      }));

    if (dups.length < 3) {
      return Array.from({ length: 12 }).map((_, i) => ({
        name: `GCS-${24000 + i}`,
        rpd: Math.abs(Math.sin(i / 1.5) * 15 + (Math.random() - 0.5) * 8),
        element: ["Au", "Cu", "Zn", "Pb", "Ag"][i % 5],
        status: "Approved",
      }));
    }
    return dups;
  }, [qaFlags]);

  const overThreshold = dupData.filter((d) => d.rpd > threshold).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Duplicate RPD Distribution</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Threshold: <strong>{threshold}%</strong> · {overThreshold} over limit
          </p>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              type="number"
              dataKey="index"
              name="Run"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              hide
            />
            <YAxis
              type="number"
              dataKey="rpd"
              name="RPD %"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              label={{
                value: "RPD %",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number, name: string) => [v.toFixed(1) + "%", name]}
            />
            <ReferenceLine
              y={threshold}
              stroke="hsl(0 84% 60%)"
              strokeDasharray="4 3"
              label={{
                value: `${threshold}% limit`,
                fill: "hsl(0 84% 60%)",
                fontSize: 10,
                position: "right",
              }}
            />
            <Scatter
              data={dupData.map((d, i) => ({ ...d, index: i }))}
              fill="var(--color-chart-1)"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const over = payload.rpd > threshold;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={over ? "hsl(0 84% 60%)" : "var(--color-chart-1)"}
                    fillOpacity={0.8}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
