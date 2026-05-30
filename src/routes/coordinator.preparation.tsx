import { createFileRoute } from "@tanstack/react-router";
import { PreparationFeature } from "../features/preparation";

export const Route = createFileRoute("/coordinator/preparation")({
  component: () => <PreparationFeature />,
});
