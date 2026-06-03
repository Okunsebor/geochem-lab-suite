import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

const NAV_LINKS = [
  { label: "Capabilities", href: "#provide" },
  { label: "Infrastructure", href: "#infrastructure" },
  { label: "Trust", href: "#reasons" },
  { label: "Partners", href: "#trusted" },
];

export default function HeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div onClick={closeMobile}>
          <UniPodLogo height={32} />
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground" aria-label="Main">
          {NAV_LINKS.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            search={{}}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="btn-theme-cyan inline-flex items-center gap-1.5 rounded-md text-sm"
          >
            Request Access <ArrowRight className="size-3.5" />
          </Link>

        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center size-9 rounded-md border border-border hover:bg-muted"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <nav className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3" aria-label="Mobile">
            {NAV_LINKS.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={closeMobile}
                className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
              >
                {n.label}
              </a>
            ))}
            <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
              <Link
                to="/login"
                search={{}}
                onClick={closeMobile}
                className="text-center rounded-md border border-border py-2.5 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
              className="btn-theme-cyan inline-flex items-center justify-center gap-1.5 rounded-md text-sm"
              >
                Request Access <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
