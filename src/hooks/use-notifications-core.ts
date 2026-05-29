import { useState } from "react";
import { SystemNotification } from "../types";

export function useNotificationsCore() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const saveNotifications = (data: SystemNotification[]) => {
    setNotifications(data);
    localStorage.setItem("gcs_notifications", JSON.stringify(data));
  };

  const addNotification = (newNotif: SystemNotification) => {
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      localStorage.setItem("gcs_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem("gcs_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("gcs_notifications", JSON.stringify([]));
  };

  return { notifications, setNotifications, saveNotifications, addNotification, markAllNotificationsRead, clearNotifications };
}
