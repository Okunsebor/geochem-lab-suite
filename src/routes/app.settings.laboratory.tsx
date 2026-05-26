import { createFileRoute } from "@tanstack/react-router";
import { LabSettingsFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/laboratory")({ component: LabSettings });

function LabSettings() {
  return <LabSettingsFields />;
}
