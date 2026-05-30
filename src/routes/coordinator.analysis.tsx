import { createFileRoute } from "@tanstack/react-router";
import { AnalysisFeature } from "../features/analysis";

export const Route = createFileRoute("/coordinator/analysis")({
  component: () => <AnalysisFeature />,
});
