import { createFileRoute } from "@tanstack/react-router";
import { IntakeFormFeature } from "../features/samples";

export const Route = createFileRoute("/app/intake")({ component: Intake });

function Intake() {
  return <IntakeFormFeature />;
}
