import { createFileRoute } from "@tanstack/react-router";
import { PortalReportsFeature } from "../features/portal";

export const Route = createFileRoute("/portal/reports")({ component: PortalReports });

function PortalReports() {
  return <PortalReportsFeature />;
}
