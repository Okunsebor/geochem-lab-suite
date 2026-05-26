import { createFileRoute } from "@tanstack/react-router";
import { PortalSupportFeature } from "../features/portal";

export const Route = createFileRoute("/portal/support")({ component: PortalSupport });

function PortalSupport() {
  return <PortalSupportFeature />;
}
