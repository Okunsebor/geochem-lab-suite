import { createFileRoute } from "@tanstack/react-router";
import NotificationDeliveryConsoleFeature from "@/features/notifications/delivery-console";

export const Route = createFileRoute("/app/notifications/delivery")({
  component: NotificationDeliveryConsoleFeature,
});
