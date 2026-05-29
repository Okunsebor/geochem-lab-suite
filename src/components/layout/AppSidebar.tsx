import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FlaskConical, Workflow, Activity, FileText,
  Users2, Bell, Settings, ScanBarcode, Beaker, ShieldCheck,
  Boxes, ClipboardList, BarChart3, HardDrive, LifeBuoy,
} from "lucide-react";
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
  {
    label: "Customer",
    items: [
      { to: "/portal", label: "Customer Portal", icon: HardDrive },
      { to: "/portal/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

import { useLimsState } from "@/hooks/use-lims-state";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser } = useLimsState();
  const initials = currentUser?.name?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "US";

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col text-sidebar-foreground border-y-0 border-l-0 rounded-none shadow-sm glass">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="grid size-8 place-items-center rounded-md gradient-primary text-white shadow-sm">
          <FlaskConical className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-foreground">GeoChem Suite</span>
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">LIMS · v0.9</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition font-medium",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-primary" : "text-sidebar-foreground/60")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/40 p-2.5">
          <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-white text-xs font-semibold">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{currentUser?.name || "Staff User"}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{currentUser?.role || "LIMS Technician"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
