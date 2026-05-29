import { useState } from "react";
import { ActivityLog } from "../types";

export function useActivityCore() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  const saveActivity = (data: ActivityLog[]) => {
    setActivity(data);
    localStorage.setItem("gcs_activity", JSON.stringify(data));
  };

  const addActivity = (newActivity: ActivityLog) => {
    setActivity((prev) => {
      const updated = [newActivity, ...prev];
      localStorage.setItem("gcs_activity", JSON.stringify(updated));
      return updated;
    });
  };

  const clearActivity = () => {
    setActivity([]);
    localStorage.setItem("gcs_activity", JSON.stringify([]));
  };

  return { activity, setActivity, saveActivity, addActivity, clearActivity };
}
