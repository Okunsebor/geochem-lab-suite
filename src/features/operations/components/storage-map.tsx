import React, { useEffect, useState } from "react";
import { Boxes, Inbox } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Sample = {
  id: string;
  tracking_code: string;
  sample_type: string;
  storage_location: string;
};

export function StorageMap() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSamples = async () => {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('id, tracking_code, sample_type, storage_location')
        .not('storage_location', 'is', null);

      if (error) throw error;
      setSamples(data || []);
    } catch (error: any) {
      console.error('Error fetching storage data:', error);
      toast.error('Failed to load storage data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'samples',
        },
        () => {
          fetchSamples();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const racks = ["A", "B", "C", "D", "E", "F"];

  const handleCellClick = (sample: Sample, rack: string, index: number) => {
    toast.info(`Slot ${rack}-${index + 1} contains sample ${sample.sample_type}: ${sample.tracking_code}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          crumbs={[{ label: "Operations" }, { label: "Storage" }]}
          title="Storage Management"
          description="Physical sample storage map and capacity."
        />
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading storage data...
        </div>
      </div>
    );
  }

  if (samples.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          crumbs={[{ label: "Operations" }, { label: "Storage" }]}
          title="Storage Management"
          description="Physical sample storage map and capacity."
        />
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Inbox className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground max-w-md font-medium text-lg">
            No storage records found. Data will appear here automatically as samples are processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Operations" }, { label: "Storage" }]}
        title="Storage Management"
        description="Physical sample storage map and capacity."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {racks.map((r) => {
          const rackSamples = samples.filter(s => {
            if (!s.storage_location) return false;
            const loc = s.storage_location.toUpperCase();
            return loc.includes(` ${r}-`) || loc.includes(`RACK ${r}`) || loc.startsWith(`${r}-`);
          });

          const slots = Array.from({ length: 12 }).map((_, i) => {
            const slotStr1 = `-${i + 1}`;
            const slotStr2 = ` ${i + 1}`;
            return rackSamples.find(s => s.storage_location.includes(slotStr1) || s.storage_location.endsWith(slotStr2)) || null;
          });
          
          let unplacedSamples = rackSamples.filter(s => !slots.includes(s));
          for (let i = 0; i < 12; i++) {
            if (!slots[i] && unplacedSamples.length > 0) {
              slots[i] = unplacedSamples.shift() || null;
            }
          }

          const filledCount = slots.filter(s => s !== null).length;

          return (
            <div
              key={r}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <h3 className="font-semibold inline-flex items-center gap-2 text-foreground">
                  <Boxes className="size-4 text-primary" /> Rack {r}
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {filledCount} / 12 slots filled
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((sample, i) => {
                  const filled = sample !== null;
                  return (
                    <div
                      key={i}
                      onClick={() => filled && sample && handleCellClick(sample, r, i)}
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
          );
        })}
      </div>
    </div>
  );
}
