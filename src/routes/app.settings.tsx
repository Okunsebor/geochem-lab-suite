import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/lims/page-header";
import { Building2, Bell, Lock, Palette, Plug, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({ component: SettingsLayout });

const tabs = [
  { to: "/app/settings", label: "Organization", icon: Building2, exact: true },
  { to: "/app/settings/laboratory", label: "Laboratory", icon: HardDrive },
  { to: "/app/settings/branding", label: "Branding", icon: Palette },
  { to: "/app/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings/security", label: "Security", icon: Lock },
  { to: "/app/settings/api", label: "API & Webhooks", icon: Plug },
];

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{label:"Administration"},{label:"Settings"}]} title="Settings" description="Configure your workspace, lab, and integrations." />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-0.5">
          {tabs.map((t)=>{
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm", active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted")}>
                <t.icon className="size-4"/> {t.label}
              </Link>
            );
          })}
        </nav>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
