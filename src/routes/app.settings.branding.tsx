import { createFileRoute } from "@tanstack/react-router";
import { BrandingSettingsFields } from "../features/administration";

export const Route = createFileRoute("/app/settings/branding")({ component: BrandingSettings });

function BrandingSettings() {
  return <BrandingSettingsFields />;
}
