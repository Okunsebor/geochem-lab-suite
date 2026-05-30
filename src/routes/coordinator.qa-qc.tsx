import { createFileRoute } from "@tanstack/react-router";
import { QaqcFeature } from "../features/qa-qc";

export const Route = createFileRoute("/coordinator/qa-qc")({
  component: () => <QaqcFeature />,
});
