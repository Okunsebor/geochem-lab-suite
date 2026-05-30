import { createFileRoute } from "@tanstack/react-router";
import { CoordinatorDashboardFeature } from "@/features/coordinator/coordinator-dashboard";

export const Route = createFileRoute("/coordinator/")({
  component: () => <CoordinatorDashboardFeature />,
});
