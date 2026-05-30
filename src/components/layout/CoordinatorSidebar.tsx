import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FlaskConical, ScanBarcode, Workflow, Beaker,
  ShieldCheck, FileText, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { useLimsState } from "@/hooks/use-lims-state";

const nav = [
  {
    label: "Coordinator workspace",
    items: [
      { to: "/coordinator", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/coordinator/samples", label: "Samples", icon: FlaskConical },
      { to: "/coordinator/intake", label: "Sample Intake", icon: ScanBarcode },
      { to: "/coordinator/preparation", label: "Preparation", icon: Workflow },
      { to: "/coordinator/analysis", label: "Analysis", icon: Beaker },
      { to: "/coordinator/qa-qc", label: "QA / QC", icon: ShieldCheck },
      { to: "/coordinator/reports", label: "Reports", icon: FileText },
      { to: "/coordinator/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export function CoordinatorSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser } = useLimsState();
  const initials = currentUser?.name?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "LC";

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col text-sidebar-foreground border-y-0 border-l-0 rounded-none shadow-sm glass">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <UniPodLogo height={28} linkToHome={false} />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-xs font-semibold text-sidebar-foreground truncate">Lab Coordinator</span>
          <span className="text-[10px] uppercase tracking-wider text-accent font-bold">GeoChem Suite</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
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
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition font-medium",
                        active
                          ? "bg-primary/15 text-primary font-bold border-l-2 border-accent"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <div className="grid size-8 place-items-center rounded-full gradient-accent text-[10px] font-bold text-accent-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60">{currentUser?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
