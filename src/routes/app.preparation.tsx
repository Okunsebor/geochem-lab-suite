import { createFileRoute } from "@tanstack/react-router";
import { PreparationFeature } from "../features/preparation";

export const Route = createFileRoute("/app/preparation")({ component: Preparation });

function Preparation() {
  return <PreparationFeature />;
}
