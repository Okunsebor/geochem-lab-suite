import { createFileRoute } from "@tanstack/react-router";
import { PortalSubmitFeature } from "../features/portal";

export const Route = createFileRoute("/portal/submit")({ component: PortalSubmit });

function PortalSubmit() {
  return <PortalSubmitFeature />;
}
