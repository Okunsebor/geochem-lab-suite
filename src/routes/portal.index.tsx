import { createFileRoute } from "@tanstack/react-router";
import { PortalDashboardFeature } from "../features/portal";

export const Route = createFileRoute("/portal/")({ component: PortalDash });

function PortalDash() {
  return <PortalDashboardFeature />;
}
