import { createFileRoute } from "@tanstack/react-router";
import { ReportsFeature } from "../features/reports";

export const Route = createFileRoute("/app/reports")({ component: Reports });

function Reports() {
  return <ReportsFeature />;
}
