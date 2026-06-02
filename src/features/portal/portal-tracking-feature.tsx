import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowLeft, Beaker, CheckCircle2, Clock3, FileCheck2, FlaskConical, Radio, ShieldCheck } from "lucide-react";
import { useLimsState } from "@/hooks/use-lims-state";
import { useSampleTracking } from "@/hooks/use-sample-tracking";
import { SAMPLE_STATUSES } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function PortalTrackingFeature({ sampleId }: { sampleId: string }) {
  const { samples, fetchSampleDetails } = useLimsState();
  const { events, loading, isConnected } = useSampleTracking(sampleId);

  const sample = useMemo(() => samples.find((s) => s.id === sampleId), [samples, sampleId]);
  const currentIdx = SAMPLE_STATUSES.indexOf((sample?.status as any) || "Received");

  useEffect(() => {
    fetchSampleDetails(sampleId);
  }, [fetchSampleDetails, sampleId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
          <Radio className={`size-3.5 ${isConnected ? "text-emerald-500" : "text-amber-500"}`} />
          {isConnected ? "Realtime connected" : "Reconnecting..."}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">GeoChem Live Tracking</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{sample?.id || sampleId}</h1>
          {sample?.status && <StatusBadge status={sample.status} />}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {sample?.project || "Sample workflow"} · Assigned technician: {sample?.technician || "Pending assignment"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FlaskConical className="size-4 text-primary" /> Workflow Progress
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {SAMPLE_STATUSES.map((status, idx) => {
            const done = idx <= currentIdx;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0.5, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-lg border p-3 ${done ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
              >
                <p className="text-xs font-semibold">{status}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{done ? "Reached" : "Pending"}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Activity className="size-4 text-primary" /> Live Tracking Timeline
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tracking events...</p>
          ) : (
            <div className="relative space-y-3 before:absolute before:left-2.5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="relative ml-6 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <span className="absolute -left-[19px] top-4 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{event.eventLabel}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{event.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {event.stage && <span className="rounded bg-background px-2 py-1">Stage: {event.stage}</span>}
                      {event.status && <span className="rounded bg-background px-2 py-1">Status: {event.status}</span>}
                      {event.technicianName && <span className="rounded bg-background px-2 py-1">Tech: {event.technicianName}</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {events.length === 0 && <p className="text-sm text-muted-foreground">No tracking events yet.</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">Chain of Custody</p>
            <div className="mt-3 space-y-2">
              {(sample?.custody || []).slice(0, 8).map((c, idx) => (
                <div key={`${c.action}-${idx}`} className="rounded border border-border bg-muted/20 p-2">
                  <p className="text-xs font-medium">{c.action}</p>
                  <p className="text-[11px] text-muted-foreground">{c.technician} · {c.time}</p>
                </div>
              ))}
              {!sample?.custody?.length && <p className="text-xs text-muted-foreground">No custody events logged.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">Tracking Highlights</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2"><Beaker className="size-3.5 text-primary" /> Preparation history visible live</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-primary" /> QA/QC pass and fails stream instantly</div>
              <div className="flex items-center gap-2"><Clock3 className="size-3.5 text-primary" /> Timestamped chain-of-custody events</div>
              <div className="flex items-center gap-2"><FileCheck2 className="size-3.5 text-primary" /> Report generation and release updates</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary" /> Dashboard and notifications auto-refresh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
