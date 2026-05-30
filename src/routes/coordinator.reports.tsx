import { createFileRoute } from "@tanstack/react-router";
import { ReportsFeature } from "../features/reports";

export const Route = createFileRoute("/coordinator/reports")({
  component: () => <ReportsFeature />,
});
