import { createFileRoute } from "@tanstack/react-router";
import { QaqcFeature } from "../features/qa-qc";

export const Route = createFileRoute("/app/qa-qc")({ component: QA });

function QA() {
  return <QaqcFeature />;
}
