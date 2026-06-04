import React from "react";
import { Boxes } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { toast } from "sonner";

export function StorageMap() {
  const racks = ["A", "B", "C", "D", "E", "F"];

  const handleCellClick = (rack: string, index: number) => {
    toast.info(`Slot ${rack}-${index + 1} contains sample Pulp: GCS-240${20 + index}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Operations" }, { label: "Storage" }]}
        title="Storage Management"
        description="Physical sample storage map and capacity."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {racks.map((r) => (
          <div
            key={r}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition"
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="font-semibold inline-flex items-center gap-2 text-foreground">
                <Boxes className="size-4 text-primary" /> Rack {r}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {8 + (r.charCodeAt(0) % 5)} / 12 slots filled
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => {
                const filled = (i + r.charCodeAt(0)) % 3 !== 0;
                return (
                  <div
                    key={i}
                    onClick={() => filled && handleCellClick(r, i)}
                    className={`aspect-square rounded text-[10px] grid place-items-center font-semibold cursor-pointer transition select-none ${
                      filled
                        ? "gradient-primary text-white shadow-sm hover:opacity-90"
                        : "border border-dashed border-border text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {filled ? `S${i + 1}` : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
