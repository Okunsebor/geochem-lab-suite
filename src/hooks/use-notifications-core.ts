import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemNotification } from "../types";
import { supabase } from "@/lib/supabase";
import { mapUiRoleToDb } from "@/lib/auth-utils";
import { toast } from "sonner";

export function useNotificationsCore(
  currentRole?: "Admin" | "Lab Coordinator" | "Customer",
  sessionUserId?: string,
) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const mapDbNotification = useCallback((n: any): SystemNotification => {
    const createdAt = n.created_at || new Date().toISOString();
    return {
      id: n.id,
      title: n.title || "Notification",
      body: n.body || undefined,
      time: new Date(createdAt).toLocaleString(),
      createdAt,
      kind: (n.kind || "info") as "alert" | "approval" | "info",
      isRead: Boolean(n.is_read),
      readAt: n.read_at || null,
      eventType: n.event_type || undefined,
      audienceRole: n.audience_role || undefined,
      channel: (n.channel || "in-app") as "in-app" | "email" | "workflow-alert",
      metadata: n.metadata || {},
    };
  }, []);

  const syncNotificationsFromDb = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const roleDb = currentRole ? mapUiRoleToDb(currentRole) : undefined;
      let query = supabase
        .from("notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (sessionUserId && roleDb) {
        query = query.or(`target_user_id.eq.${sessionUserId},audience_role.eq.${roleDb}`);
      } else if (sessionUserId) {
        query = query.eq("target_user_id", sessionUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications((data || []).map(mapDbNotification));
    } catch {
      const local = localStorage.getItem("gcs_notifications");
      setNotifications(local ? JSON.parse(local) : []);
    } finally {
      setLoadingNotifications(false);
    }
  }, [currentRole, mapDbNotification, sessionUserId]);

  const saveNotifications = (data: SystemNotification[]) => {
    setNotifications(data);
    localStorage.setItem("gcs_notifications", JSON.stringify(data));
  };

  const addNotification = useCallback(
    async (
      newNotif: Pick<SystemNotification, "title" | "kind"> &
        Partial<Omit<SystemNotification, "id" | "title" | "kind">> & {
          targetUserId?: string;
          sendEmail?: boolean;
        },
    ) => {
      try {
        const { data, error } = await supabase
          .from("notifications" as any)
          .insert({
            target_user_id: newNotif.targetUserId || sessionUserId,
            title: newNotif.title,
            body: newNotif.body || null,
            kind: newNotif.kind,
            is_read: false,
            event_type: newNotif.eventType || "system",
            audience_role:
              newNotif.audienceRole || (currentRole ? mapUiRoleToDb(currentRole) : null),
            channel: newNotif.channel || "in-app",
            metadata: newNotif.metadata || {},
          })
          .select("*")
          .single();

        if (error) throw error;

        if (newNotif.sendEmail && (newNotif.targetUserId || sessionUserId)) {
          const recipient = newNotif.targetUserId || sessionUserId;
          const { error: emailErr } = await supabase.from("notification_emails" as any).insert({
            notification_id: data?.id || null,
            recipient_user_id: recipient,
            recipient_email: "queued@geochem.local",
            subject: newNotif.title,
            body: newNotif.body || newNotif.title,
            status: "queued",
          });
          if (emailErr) throw emailErr;
        }

        const fallback: SystemNotification = {
          id: data?.id || Date.now().toString(),
          title: newNotif.title,
          body: newNotif.body,
          kind: newNotif.kind,
          isRead: false,
          time: "Just now",
          createdAt: new Date().toISOString(),
          eventType: newNotif.eventType,
          audienceRole: newNotif.audienceRole,
          channel: newNotif.channel || "in-app",
          metadata: newNotif.metadata,
        };

        setNotifications((prev) => {
          const updated = [fallback, ...prev];
          localStorage.setItem("gcs_notifications", JSON.stringify(updated));
          return updated;
        });
      } catch (err: any) {
        toast.error(`Failed to add notification: ${err.message || "Unknown error"}`);
        throw err;
      }
    },
    [currentRole, sessionUserId],
  );

  const markNotificationRead = useCallback(async (notificationId: string | number) => {
    try {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId as any);

      if (error) throw error;

      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        );
        localStorage.setItem("gcs_notifications", JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      toast.error(`Failed to mark notification read: ${err.message || "Unknown error"}`);
      throw err;
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("target_user_id", sessionUserId as any);

      if (error) throw error;

      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, isRead: true }));
        localStorage.setItem("gcs_notifications", JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      toast.error(`Failed to mark all notifications read: ${err.message || "Unknown error"}`);
      throw err;
    }
  }, [sessionUserId]);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("gcs_notifications", JSON.stringify([]));
  };

  useEffect(() => {
    syncNotificationsFromDb();
  }, [syncNotificationsFromDb]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-notifications-${sessionUserId || "anon"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        syncNotificationsFromDb();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionUserId, syncNotificationsFromDb]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return {
    notifications,
    loadingNotifications,
    unreadCount,
    setNotifications,
    saveNotifications,
    syncNotificationsFromDb,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  };
}
