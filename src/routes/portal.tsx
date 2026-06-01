import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, FilePlus2, FileText, Bell, LifeBuoy, Sun, Moon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Portal3DScene } from "@/components/portal/Portal3DScene";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

export const Route = createFileRoute("/portal")({ component: PortalLayout });

const nav = [
  { to: "/portal", label: "Dashboard", icon: Home, exact: true },
  { to: "/portal/submit", label: "Submit Sample", icon: FilePlus2 },
  { to: "/portal/reports", label: "My Reports", icon: FileText },
  { to: "/portal/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/support", label: "Support", icon: LifeBuoy },
];

function PortalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser, loading, emailVerified, session } = useAuth();
  const navigate = useNavigate();

  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("gcs_dark_mode");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("gcs_dark_mode", String(dark));
  }, [dark]);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        toast.info("Register or sign in to access the customer portal.");
        navigate({ to: "/register" });
      } else if (session && !emailVerified) {
        toast.info("Please verify your email to access the portal.");
        window.location.href = getVerifyEmailPath(currentUser.email);
      } else if (currentUser.role === "Admin") {
        navigate({ to: "/app" });
      } else if (currentUser.role === "Lab Coordinator" || currentUser.role === "Lab Staff") {
        window.location.href = "/coordinator";
      } else if (currentUser.role !== "Customer") {
        navigate({ to: "/login", search: { intent: "portal" } });
      }
    }
  }, [loading, currentUser, emailVerified, session, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="lims-orbit-container mx-auto">
            <div className="lims-orbit-ring" />
            <div className="lims-orbit-ring" />
            <div className="lims-orbit-ring" />
          </div>
          <div className="space-y-2">
            <div className="dna-helix-container mx-auto">
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
              <div className="dna-helix-node" />
            </div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">Securing Portal Authentication</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const initials = currentUser.name.split(" ").map((x) => x[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Portal3DScene />
      <header className="sticky top-0 z-30 shrink-0 border-x-0 border-t-0 rounded-none shadow-sm glass border-b border-primary/10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          
          <div className="flex items-center gap-3">
            {/* Hamburger button visible only on <md screens */}
            <button
              onClick={() => setShowMobileNav(true)}
              className="flex md:hidden items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition active:scale-95 shrink-0"
              aria-label="Open portal navigation menu"
            >
              <Menu className="size-5" />
            </button>

            <Link to="/portal" className="flex items-center gap-3 min-w-0">
              <UniPodLogo height={28} linkToHome={false} />
              <span className="font-semibold text-foreground truncate text-sm border-l border-border pl-3">
                Customer Portal
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    active ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <n.icon className="size-4" /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm select-none">
              <div className="grid size-6 place-items-center rounded-full bg-success text-[10px] font-semibold text-white">
                {initials}
              </div>
              <span className="hidden md:inline font-medium text-foreground">{currentUser.name}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Customer Portal Drawer */}
      <AnimatePresence>
        {showMobileNav && (
          <div className="fixed inset-0 z-50 flex md:hidden">
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
              className="relative z-10 flex w-64 max-w-[80vw] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex h-14 items-center justify-between px-5 border-b border-sidebar-border shrink-0">
                <span className="text-sm font-semibold">Portal Navigation</span>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="rounded-md p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Navigation links scrollarea */}
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 text-left">
                {nav.map((n) => {
                  const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setShowMobileNav(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition font-medium",
                        active
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <n.icon className="size-4" /> {n.label}
                    </Link>
                  );
                })}
              </nav>

              {/* User details at base */}
              <div className="border-t border-sidebar-border p-4 shrink-0 bg-sidebar-accent/15">
                <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/35 border border-sidebar-border/30 p-2.5">
                  <div className="grid size-8 place-items-center rounded-full bg-success text-white text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-xs font-bold text-sidebar-foreground">{currentUser.name}</p>
                    <p className="truncate text-[10px] text-sidebar-foreground/60">{currentUser.role}</p>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 overflow-x-hidden">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          className="will-change-[transform,opacity]"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
