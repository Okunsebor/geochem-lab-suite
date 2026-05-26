import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FlaskConical, Home, FilePlus2, FileText, Bell, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md gradient-primary text-white"><FlaskConical className="size-4"/></div>
            <span className="font-semibold">GeoChem · Customer Portal</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm", active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted")}>
                  <n.icon className="size-4"/> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm">
            <div className="grid size-6 place-items-center rounded-full bg-success text-[10px] font-semibold text-white">JC</div>
            <span className="hidden md:inline font-medium">Jane Chen</span>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8"><Outlet /></main>
    </div>
  );
}
