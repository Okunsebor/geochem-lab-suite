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
  Boxes,
  ClipboardList,
  BarChart3,
  Menu,
} from "lucide-react";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { cn } from "@/lib/utils";
import { useLimsState } from "@/hooks/use-lims-state";

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
      {/* Spacer div to push main content right */}
      <div className="hidden lg:block w-[68px] shrink-0" />

      <aside className="group hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col text-sidebar-foreground border-r border-sidebar-border shadow-xl overflow-hidden bg-background/95 backdrop-blur-md hover:bg-background w-[68px] hover:w-64 transition-[width] duration-200 ease-in-out">

        {/* ── Header ── */}
        <div className="flex h-14 items-center border-b border-sidebar-border shrink-0 overflow-hidden">
          {/* Collapsed: hamburger icon, centered */}
          <div className="flex items-center justify-center w-[68px] shrink-0 group-hover:hidden">
            <Menu className="size-5 text-sidebar-foreground/70" />
          </div>
          {/* Expanded: full logo + branding */}
          <div className="hidden group-hover:flex items-center gap-3 px-5 w-full">
            <UniPodLogo height={28} linkToHome={false} />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-semibold text-sidebar-foreground whitespace-nowrap">
                Admin Portal
              </span>
              <span className="text-[10px] uppercase tracking-wider text-accent font-bold whitespace-nowrap">
                GeoChem Suite
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {nav.map((group) => (
            <div key={group.label}>
              {/* Group label – only in expanded */}
              <p className="hidden group-hover:block px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 whitespace-nowrap">
                {group.label}
              </p>
              <ul className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.to
                    : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "flex items-center rounded-md py-2 text-sm font-medium transition-colors duration-150",
                          // collapsed: center icon; expanded: left-align with padding
                          "justify-center group-hover:justify-start group-hover:gap-3 group-hover:px-3",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0",
                            active ? "text-primary" : "text-sidebar-foreground/55",
                          )}
                        />
                        {/* Label: hidden in collapsed, shown in expanded */}
                        <span className="hidden group-hover:inline-block whitespace-nowrap">
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

        {/* ── Footer: user avatar ── */}
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <div className="flex items-center gap-3 rounded-lg p-1.5 justify-center group-hover:justify-start group-hover:bg-sidebar-accent/40 group-hover:border group-hover:border-sidebar-border/40 transition-colors">
            <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="hidden group-hover:block flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground whitespace-nowrap">
                {currentUser?.name || "Staff User"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60 whitespace-nowrap capitalize">
                {currentUser?.role || "LIMS Technician"}
              </p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
