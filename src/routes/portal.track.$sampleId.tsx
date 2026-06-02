import { createFileRoute } from "@tanstack/react-router";
import { PortalTrackingFeature } from "@/features/portal/portal-tracking-feature";

export const Route = createFileRoute("/portal/track/$sampleId")({
  component: PortalTrackPage,
});

function PortalTrackPage() {
  const { sampleId } = Route.useParams();
  return <PortalTrackingFeature sampleId={sampleId} />;
}
