import { createFileRoute } from "@tanstack/react-router";
import { OrgSettingsFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/")({ component: Org });

function Org() {
  return <OrgSettingsFields />;
}
