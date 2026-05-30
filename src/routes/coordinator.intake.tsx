import { createFileRoute } from "@tanstack/react-router";
import { IntakeFormFeature } from "../features/samples";

export const Route = createFileRoute("/coordinator/intake")({
  component: () => <IntakeFormFeature />,
});
