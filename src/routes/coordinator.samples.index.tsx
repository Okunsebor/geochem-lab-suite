import { createFileRoute } from "@tanstack/react-router";
import { SamplesFilterTable } from "../features/samples";

export const Route = createFileRoute("/coordinator/samples/")({
  component: () => <SamplesFilterTable />,
});
