import { 
  Menu, X, FlaskConical, LayoutDashboard, Workflow, Activity, Settings, 
  ScanBarcode, Beaker, ShieldCheck, Boxes, ClipboardList, BarChart3, 
  Users2, HardDrive, LifeBuoy, Bell, FileText, Mail
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useLimsState } from "@/hooks/use-lims-state";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TopbarSearch } from "./TopbarSearch";
import { TopbarUserMenu } from "./TopbarUserMenu";
import { TopbarNotifications } from "./TopbarNotifications";

// Hierarchical LIMS sidebar menus
const nav: Array<{
  label: string;
  items: Array<{
    to: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    exact?: boolean;
  }>;
}> = [
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
      { to: "/app/notifications/delivery", label: "Delivery Console", icon: Mail },
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

export function AppTopbar() {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const { currentUser } = useLimsState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const initials = currentUser?.name?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "US";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:px-6 glass border-x-0 border-t-0 rounded-none shadow-sm">
        
        {/* Mobile Hamburger menu */}
        <button
          onClick={() => setShowMobileNav(true)}
          className="flex lg:hidden items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition active:scale-95 shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex flex-1 items-center gap-3">
          <TopbarSearch />
        </div>
        
        <TopbarNotifications />
        <TopbarUserMenu />
      </header>

      {/* Mobile Sidebar Navigation Drawer Panel */}
      <AnimatePresence>
        {showMobileNav && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop filter overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileNav(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex h-14 items-center justify-between px-5 border-b border-sidebar-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-md gradient-primary text-white shadow-sm">
                    <FlaskConical className="size-4" />
                  </div>
                  <div className="flex flex-col leading-tight text-left">
                    <span className="text-sm font-semibold text-sidebar-foreground">GeoChem Suite</span>
                    <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">LIMS Menu</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="rounded-md p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Navigation Items list scrollarea */}
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 text-left">
                {nav.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{group.label}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                        const Icon = item.icon;
                        return (
                          <li key={item.to}>
                            <Link
                              to={item.to}
                              onClick={() => setShowMobileNav(false)}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition font-medium",
                                active
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <Icon className={cn("size-4", active ? "text-primary font-bold" : "text-sidebar-foreground/60")} />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* User profile details container at base */}
              <div className="border-t border-sidebar-border p-4 shrink-0 bg-sidebar-accent/15">
                <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/35 border border-sidebar-border/30 p-2.5">
                  <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-white text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-xs font-bold text-sidebar-foreground">{currentUser?.name || "Staff User"}</p>
                    <p className="truncate text-[10px] text-sidebar-foreground/60">{currentUser?.role || "LIMS Technician"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
