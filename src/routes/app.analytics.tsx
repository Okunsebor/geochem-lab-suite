import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "../features/operations";

export const Route = createFileRoute("/app/analytics")({ component: Analytics });

function Analytics() {
  return <AnalyticsDashboard />;
}
