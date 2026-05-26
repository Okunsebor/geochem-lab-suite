import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSettingsFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/notifications")({ component: NotificationsSettings });

function NotificationsSettings() {
  return <NotificationsSettingsFields />;
}
