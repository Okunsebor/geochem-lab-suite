import { createFileRoute } from "@tanstack/react-router";
import { ActivityLogsTable } from "../features/operations";

export const Route = createFileRoute("/app/activity")({ component: ActivityLog });

function ActivityLog() {
  return <ActivityLogsTable />;
}
