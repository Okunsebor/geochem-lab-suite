import { Link } from "@tanstack/react-router";
import { FlaskConical, ArrowRight } from "lucide-react";

export default function HeaderNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid size-8 place-items-center rounded-md gradient-primary text-white transition-transform group-hover:scale-105 group-hover:rotate-6">
            <FlaskConical className="size-4" />
          </div>
          <span className="font-semibold tracking-tight transition-colors group-hover:text-primary">GeoChem Suite</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {["Platform", "Modules", "Analytics", "Security"].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`}
              className="hover:text-foreground transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all hover:after:w-full">{n}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Sign in</Link>
          <Link to="/app" className="inline-flex items-center gap-1.5 rounded-md gradient-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-95 transition-all hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5">
            Launch app <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
