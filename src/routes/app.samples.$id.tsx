import { createFileRoute } from "@tanstack/react-router";
import { SampleDetailsViewer } from "../features/samples";

export const Route = createFileRoute("/app/samples/$id")({ component: SampleDetail });

function SampleDetail() {
  const { id } = Route.useParams();
  return <SampleDetailsViewer sampleId={id} />;
}
