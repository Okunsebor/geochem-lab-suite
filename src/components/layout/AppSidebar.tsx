import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FlaskConical,
  Workflow,
  Activity,
  FileText,
  Users2,
  Bell,
  Settings,
  ScanBarcode,
  Beaker,
  ShieldCheck,
  MailCheck,
  Boxes,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { cn } from "@/lib/utils";

const nav = [
  {
    label: "Workspace",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/samples", label: "Samples", icon: FlaskConical },
      { to: "/app/intake", label: "Sample Intake", icon: ScanBarcode },
      { to: "/app/preparation", label: "Preparation", icon: Workflow },
      { to: "/app/analysis", label: "Analysis", icon: Beaker },
      { to: "/app/qa-qc", label: "QA / QC", icon: ShieldCheck },
      { to: "/app/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/app/instruments", label: "Instruments", icon: Activity },
      { to: "/app/storage", label: "Storage", icon: Boxes },
      { to: "/app/activity", label: "Activity Logs", icon: ClipboardList },
      { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/app/users", label: "Users & Roles", icon: Users2 },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

import { useLimsState } from "@/hooks/use-lims-state";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser } = useLimsState();
  const initials =
    currentUser?.name
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2) || "US";

  return (
    <>
      <div className="hidden lg:block w-[68px] shrink-0 border-r border-sidebar-border/30 bg-sidebar/5" />
      <aside className="group hidden lg:flex absolute left-0 top-0 bottom-0 w-[68px] hover:w-64 transition-[width] duration-200 ease-in-out z-50 flex-col text-sidebar-foreground border-y-0 border-l-0 border-r border-sidebar-border rounded-none shadow-xl glass overflow-hidden bg-background/95 backdrop-blur-md hover:bg-background">
        <div className="w-64 flex flex-col h-full">
          <div className="flex h-14 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
            <UniPodLogo height={28} linkToHome={false} />
            <div className="flex flex-col leading-tight min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs font-semibold text-sidebar-foreground truncate whitespace-nowrap">
                Admin Portal
              </span>
              <span className="text-[10px] uppercase tracking-wider text-accent font-bold whitespace-nowrap">
                GeoChem Suite
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {nav.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          title={item.label}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors font-medium",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-5 shrink-0",
                              active ? "text-primary" : "text-sidebar-foreground/60",
                            )}
                          />
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-3 shrink-0 relative">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/40 p-2 overflow-hidden">
              <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-white text-xs font-semibold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="truncate text-sm font-semibold text-sidebar-foreground whitespace-nowrap">
                  {currentUser?.name || "Staff User"}
                </p>
                <p className="truncate text-[11px] text-sidebar-foreground/60 whitespace-nowrap">
                  {currentUser?.role || "LIMS Technician"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
