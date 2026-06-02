import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface TrackingEvent {
  id: string;
  sampleId: string;
  eventType: string;
  eventLabel: string;
  summary: string;
  stage?: string;
  status?: string;
  technicianName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function useSampleTracking(sampleId?: string) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncEvents = useCallback(async () => {
    if (!sampleId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tracking_updates" as any)
        .select("*")
        .eq("sample_id", sampleId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const mapped: TrackingEvent[] = (data || []).map((row: any) => ({
        id: row.id,
        sampleId: row.sample_id,
        eventType: row.event_type,
        eventLabel: row.event_label,
        summary: row.summary,
        stage: row.stage || undefined,
        status: row.status || undefined,
        technicianName: row.technician_name || undefined,
        createdAt: row.created_at,
        metadata: row.metadata || {},
      }));
      setEvents(mapped);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [sampleId]);

  useEffect(() => {
    syncEvents();
  }, [syncEvents]);

  useEffect(() => {
    if (!sampleId) return;
    const channel = supabase
      .channel(`sample-tracking-${sampleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracking_updates", filter: `sample_id=eq.${sampleId}` },
        () => {
          syncEvents();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
    };
  }, [sampleId, syncEvents]);

  return useMemo(
    () => ({ events, loading, isConnected, refresh: syncEvents }),
    [events, loading, isConnected, syncEvents]
  );
}
