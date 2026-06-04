import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  FilePlus2,
  FileText,
  Bell,
  LifeBuoy,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getVerifyEmailPath } from "@/lib/auth-routes";
import { motion, AnimatePresence } from "framer-motion";
import { Portal3DScene } from "@/components/portal/Portal3DScene";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { supabase } from "@/lib/supabase";
import { mapDbRoleToUi, isEmailConfirmed } from "@/lib/auth-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  beforeLoad: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session?.user) {
      throw redirect({ to: "/register" });
    }

    if (!isEmailConfirmed(session.user)) {
      throw redirect({ href: getVerifyEmailPath(session.user.email) });
    }

    const { data: profile } = await supabase
      .from("users" as any)
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const rawRole: string | null =
      profile?.role ?? session.user.user_metadata?.role ?? null;

    if (!rawRole) {
      throw redirect({ to: "/login", search: { intent: "portal" } });
    }

    const role = mapDbRoleToUi(rawRole);

    if (role === "Admin") {
      throw redirect({ to: "/app" });
    } else if (role === "Lab Coordinator") {
      throw redirect({ to: "/coordinator" });
    } else if (role !== "Customer") {
      throw redirect({ to: "/login", search: { intent: "portal" } });
    }
  },
  component: PortalLayout,
});

const nav = [
  { to: "/portal", label: "Dashboard", icon: Home, exact: true },
  { to: "/portal/submit", label: "Submit Sample", icon: FilePlus2 },
  { to: "/portal/reports", label: "My Reports", icon: FileText },
  { to: "/portal/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/support", label: "Support", icon: LifeBuoy },
];

function PortalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser, loading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

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
            <p className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">
              Securing Portal Authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

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
                    active
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted",
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
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm select-none cursor-pointer hover:bg-muted/50 transition active:scale-98"
              >
                <div className="grid size-6 place-items-center rounded-full bg-success text-[10px] font-semibold text-white">
                  {initials}
                </div>
                <span className="hidden md:inline font-medium text-foreground">
                  {currentUser.name}
                </span>
                <ChevronDown
                  className="size-3.5 text-muted-foreground transition-transform duration-200"
                  style={{ transform: showUserMenu ? "rotate(180deg)" : "none" }}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-2 py-1.5 border-b border-border/60 mb-1 text-left">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{currentUser.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info("Profile page coming soon.");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                  >
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-destructive" />
                    Sign Out
                  </button>
                </div>
              )}
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
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
                  <div className="grid size-8 place-items-center rounded-full bg-success text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-xs font-bold text-sidebar-foreground">
                      {currentUser.name}
                    </p>
                    <p className="truncate text-[10px] text-sidebar-foreground/60">
                      {currentUser.role}
                    </p>
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
