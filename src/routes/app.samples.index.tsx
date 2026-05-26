import { createFileRoute } from "@tanstack/react-router";
import { SamplesFilterTable } from "../features/samples";

export const Route = createFileRoute("/app/samples/")({ component: SamplesPage });

function SamplesPage() {
  return <SamplesFilterTable />;
}
