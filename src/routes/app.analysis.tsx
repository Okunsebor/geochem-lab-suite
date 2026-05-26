import { createFileRoute } from "@tanstack/react-router";
import { AnalysisFeature } from "../features/analysis";

export const Route = createFileRoute("/app/analysis")({ component: Analysis });

function Analysis() {
  return <AnalysisFeature />;
}
