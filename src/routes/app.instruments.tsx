import { createFileRoute } from "@tanstack/react-router";
import { InstrumentsGrid } from "../features/operations";

export const Route = createFileRoute("/app/instruments")({ component: Instr });

function Instr() {
  return <InstrumentsGrid />;
}
