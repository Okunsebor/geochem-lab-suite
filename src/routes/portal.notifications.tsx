import { createFileRoute } from "@tanstack/react-router";
import { PortalNotificationsFeature } from "../features/portal";

export const Route = createFileRoute("/portal/notifications")({ component: PN });

function PN() {
  return <PortalNotificationsFeature />;
}
