import React from "react";
import { FlaskConical } from "lucide-react";
import { AnalyticalMethod } from "../../../types";

interface MethodLibraryProps {
  methods: AnalyticalMethod[];
}

const METHOD_COLORS: Record<string, string> = {
  "FA-AAS": "hsl(38 95% 55%)",
  "ICP-MS-51E": "hsl(210 90% 55%)",
  "ICP-OES-4A": "hsl(270 75% 60%)",
  "LECO-CS": "hsl(158 64% 48%)",
  "AR-ICP-MS": "hsl(340 80% 55%)",
};

export function MethodLibrary({ methods }: MethodLibraryProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-muted/20">
        <FlaskConical className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Method Library</h3>
        <span className="ml-auto text-xs text-muted-foreground">{methods.length} methods</span>
      </div>

      <ul className="divide-y divide-border">
        {methods.map((m) => {
          const color = METHOD_COLORS[m.code] || "hsl(var(--primary))";
          return (
            <li key={m.id} className="flex gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div
                className="size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}20` }}
              >
                <FlaskConical className="size-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-foreground">{m.code}</span>
                  <span className="text-xs text-muted-foreground font-medium">{m.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                  {m.description}
                </p>

                {/* Elements */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.elementsTargeted.slice(0, 8).map((el) => (
                    <span
                      key={el}
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold font-mono"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {el}
                    </span>
                  ))}
                  {m.elementsTargeted.length > 8 && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      +{m.elementsTargeted.length - 8} more
                    </span>
                  )}
                </div>

                {/* QC thresholds */}
                <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>
                    Dup RPD:{" "}
                    <strong className="text-foreground">{m.qcThresholds.duplicateRpd}%</strong>
                  </span>
                  <span>
                    CRM Tol:{" "}
                    <strong className="text-foreground">±{m.qcThresholds.crmTolerance}%</strong>
                  </span>
                  <span>
                    Blank:{" "}
                    <strong className="text-foreground">
                      {m.qcThresholds.blankMultiplier}× DL
                    </strong>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
