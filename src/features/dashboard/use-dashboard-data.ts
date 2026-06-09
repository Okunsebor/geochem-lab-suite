import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { differenceInDays, subDays, formatDistanceToNow, parseISO } from "date-fns";

export function useDashboardData() {
  const [activeSamples, setActiveSamples] = useState(0);
  const [avgTurnaround, setAvgTurnaround] = useState(0);
  const [qaQcPassRate, setQaQcPassRate] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [recentSamples, setRecentSamples] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [workflowSplit, setWorkflowSplit] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Active Samples
      const { count: activeCount } = await supabase
        .from("samples")
        .select("*", { count: "exact", head: true })
        .not("status", "eq", "Completed")
        .not("status", "eq", "Report Ready")
        .not("status", "eq", "Rejected");
      setActiveSamples(activeCount || 0);

      // 2. Overdue Samples (older than 7 days, still active)
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count: overdueCount } = await supabase
        .from("samples")
        .select("*", { count: "exact", head: true })
        .lt("created_at", sevenDaysAgo)
        .not("status", "eq", "Completed")
        .not("status", "eq", "Report Ready")
        .not("status", "eq", "Rejected");
      setOverdue(overdueCount || 0);

      // 3. Recent Samples
      const { data: recentData } = await supabase
        .from("samples")
        .select(`
          id, 
          project_name, 
          sample_type, 
          status,
          created_at,
          registered_by_user_id
        `)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (recentData) {
        // Try to fetch users for technician names if needed, but for simplicity we will just map what we have
        setRecentSamples(recentData.map(s => ({
          id: s.id,
          client: s.project_name || "Unknown Project", 
          type: s.sample_type,
          technician: "Lab Staff", // Could join users table, but keeping it simple for dashboard
          status: s.status
        })));
      }

      // 4. Alerts and Notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (notifData) {
        setRecentNotifications(notifData.map(n => ({
          id: n.id,
          title: n.title,
          kind: n.kind,
          time: n.created_at ? formatDistanceToNow(parseISO(n.created_at)) : "Unknown"
        })));
      }

      // 5. QA/QC Pass Rate
      const { data: qaFlags } = await supabase.from("qa_flags").select("status");
      if (qaFlags && qaFlags.length > 0) {
        const resolved = qaFlags.filter((f) => 
          f.status.toLowerCase() === "resolved" || 
          f.status.toLowerCase() === "approved" ||
          f.status.toLowerCase() === "closed" ||
          f.status.toLowerCase() === "revised"
        ).length;
        setQaQcPassRate(Number(((resolved / qaFlags.length) * 100).toFixed(1)));
      } else {
        setQaQcPassRate(100);
      }

      // 6. Avg Turnaround (completed samples)
      const { data: completedSamples } = await supabase
        .from("samples")
        .select("id, created_at")
        .in("status", ["Completed", "Report Ready"]);

      if (completedSamples && completedSamples.length > 0) {
        const sampleIds = completedSamples.map((s) => s.id);
        const { data: trackingUpdates } = await supabase
          .from("tracking_updates")
          .select("sample_id, created_at")
          .in("sample_id", sampleIds)
          .order("created_at", { ascending: false });

        if (trackingUpdates && trackingUpdates.length > 0) {
          let totalDays = 0;
          let count = 0;

          completedSamples.forEach(s => {
            const updates = trackingUpdates.filter(u => u.sample_id === s.id);
            if (updates.length > 0) {
              const latestUpdate = new Date(updates[0].created_at);
              const createdAt = new Date(s.created_at);
              totalDays += Math.max(0, differenceInDays(latestUpdate, createdAt));
              count++;
            }
          });

          if (count > 0) {
            setAvgTurnaround(Number((totalDays / count).toFixed(1)));
          } else {
            setAvgTurnaround(0);
          }
        } else {
          setAvgTurnaround(0);
        }
      } else {
        setAvgTurnaround(0);
      }

      // 7. Workflow Split
      const { data: trackingSplit } = await supabase
        .from("tracking_updates")
        .select("sample_id, stage, created_at")
        .order("created_at", { ascending: false });

      if (trackingSplit && trackingSplit.length > 0) {
        // Get the latest stage per sample
        const latestStagePerSample = new Map<string, string>();
        trackingSplit.forEach(u => {
          if (!latestStagePerSample.has(u.sample_id) && u.stage) {
            latestStagePerSample.set(u.sample_id, u.stage);
          }
        });

        const counts: Record<string, number> = {};
        latestStagePerSample.forEach((stage) => {
          counts[stage] = (counts[stage] || 0) + 1;
        });

        const splitData = Object.keys(counts).map(stage => ({
          name: stage,
          value: counts[stage]
        }));

        setWorkflowSplit(splitData);
      } else {
        setWorkflowSplit([]);
      }

    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // realtime subscriptions
    const subSamples = supabase.channel("dashboard-samples")
      .on("postgres_changes", { event: "*", schema: "public", table: "samples" }, fetchDashboardData)
      .subscribe();
      
    const subTracking = supabase.channel("dashboard-tracking")
      .on("postgres_changes", { event: "*", schema: "public", table: "tracking_updates" }, fetchDashboardData)
      .subscribe();
      
    const subNotifications = supabase.channel("dashboard-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchDashboardData)
      .subscribe();
      
    const subQa = supabase.channel("dashboard-qa")
      .on("postgres_changes", { event: "*", schema: "public", table: "qa_flags" }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(subSamples);
      supabase.removeChannel(subTracking);
      supabase.removeChannel(subNotifications);
      supabase.removeChannel(subQa);
    };
  }, [fetchDashboardData]);

  return {
    activeSamples,
    avgTurnaround,
    qaQcPassRate,
    overdue,
    recentSamples,
    recentNotifications,
    workflowSplit
  };
}
