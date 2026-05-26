import { createFileRoute } from "@tanstack/react-router";
import { ApiWebhooksFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/api")({ component: ApiSettings });

function ApiSettings() {
  return <ApiWebhooksFields />;
}
