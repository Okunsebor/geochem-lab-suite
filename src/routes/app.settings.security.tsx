import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/security")({ component: SecuritySettings });

function SecuritySettings() {
  return <SecuritySettingsFields />;
}
