import { createFileRoute } from "@tanstack/react-router";
import { DashboardFeature } from "../features/dashboard";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  return <DashboardFeature />;
}
