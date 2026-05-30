import { createFileRoute } from "@tanstack/react-router";
import NotificationsFeature from "@/features/notifications";

export const Route = createFileRoute("/coordinator/notifications")({
  component: NotificationsFeature,
});
