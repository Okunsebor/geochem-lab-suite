import React, { useEffect, useState } from "react";
import { Activity, Wrench, Inbox, Clock, PlayCircle } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, parseISO } from "date-fns";

type DBInstrument = {
  id: string;
  name: string;
  status: string;
  last_calibrated: string | null;
};

type AnalyticalRun = {
  id: string;
  instrument_id: string;
  status: string;
  analyst_name: string;
  method: string;
  started_at: string | null;
};

type CalibrationRecord = {
  instrument_id: string;
  next_due_date: string;
  calibration_date: string;
};

export function InstrumentsGrid() {
  const [instruments, setInstruments] = useState<DBInstrument[]>([]);
  const [runs, setRuns] = useState<AnalyticalRun[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Instruments
      const { data: instData, error: instErr } = await supabase
        .from('instruments')
        .select('*')
        .order('name');
      if (instErr) throw instErr;
      
      const fetchedInstruments = instData || [];
      setInstruments(fetchedInstruments);

      if (fetchedInstruments.length > 0) {
        const instIds = fetchedInstruments.map(i => i.id);

        // 2. Fetch Analytical Runs
        const { data: runData, error: runErr } = await supabase
          .from('analytical_runs')
          .select('*')
          .in('instrument_id', instIds)
          .order('started_at', { ascending: false });
        if (runErr) throw runErr;
        setRuns(runData || []);

        // 3. Fetch Calibrations
        const { data: calData, error: calErr } = await supabase
          .from('calibration_records')
          .select('instrument_id, calibration_date, next_due_date')
          .in('instrument_id', instIds)
          .order('calibration_date', { ascending: false });
        if (calErr) throw calErr;
        setCalibrations(calData || []);
      }
    } catch (err: any) {
      console.error('Error fetching instrument data:', err);
      toast.error('Failed to load instrument data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const instChannel = supabase
      .channel('instruments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instruments' }, () => {
        fetchData();
      })
      .subscribe();

    const runsChannel = supabase
      .channel('runs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytical_runs' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(instChannel);
      supabase.removeChannel(runsChannel);
    };
  }, []);

  const handleMaintenance = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Maintenance" ? "Operational" : "Maintenance";
    try {
      const { error } = await supabase
        .from('instruments')
        .update({ status: nextStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Instrument ${id} marked as ${nextStatus}`);
    } catch (err) {
      toast.error(`Failed to update status for ${id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader crumbs={[{ label: "Operations" }, { label: "Instruments" }]} title="Instruments" description="Monitor instrument health, queues, and calibration schedules." />
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading instruments...</div>
      </div>
    );
  }

  if (instruments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader crumbs={[{ label: "Operations" }, { label: "Instruments" }]} title="Instruments" description="Monitor instrument health, queues, and calibration schedules." />
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Inbox className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground max-w-md font-medium text-lg">
            No instruments registered yet. Instruments will appear here once added to the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: "Operations" }, { label: "Instruments" }]} title="Instruments" description="Monitor instrument health, queues, and calibration schedules." />
      <div className="grid gap-4 lg:grid-cols-2">
        {instruments.map((i) => {
          const recentRun = runs.find(r => r.instrument_id === i.id);
          const recentCal = calibrations.find(c => c.instrument_id === i.id);
          
          const lastCalStr = i.last_calibrated || (recentCal ? new Date(recentCal.calibration_date).toLocaleDateString() : "Unknown");
          const nextCalStr = recentCal?.next_due_date ? new Date(recentCal.next_due_date).toLocaleDateString() : "Not scheduled";

          return (
            <div key={i.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{i.name}</p>
                  <p className="text-xs text-muted-foreground font-mono font-medium">{i.id}</p>
                </div>
                <StatusBadge status={i.status as any} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-semibold pb-4 border-b border-border/50">
                <div>
                  <p className="text-muted-foreground">Last calibrated</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{lastCalStr}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next due</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{nextCalStr}</p>
                </div>
              </div>

              <div className="mt-4 flex-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Recent Activity</p>
                {recentRun ? (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <PlayCircle className="size-3.5 text-primary" /> {recentRun.method}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border">
                        {recentRun.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                      <span>Analyst: {recentRun.analyst_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {recentRun.started_at ? formatDistanceToNow(parseISO(recentRun.started_at), { addSuffix: true }) : "Unknown start"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/20 border border-dashed border-border rounded-lg p-3 text-sm text-center text-muted-foreground">
                    No active runs
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button onClick={() => toast.info(`Viewing calibration logs for ${i.id}`)} className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition">
                  <Activity className="size-3.5 text-muted-foreground" /> View logs
                </button>
                <button onClick={() => handleMaintenance(i.id, i.status)} className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition">
                  <Wrench className="size-3.5 text-muted-foreground" />
                  {i.status === "Maintenance" ? "Complete Cal" : "Maintenance"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
