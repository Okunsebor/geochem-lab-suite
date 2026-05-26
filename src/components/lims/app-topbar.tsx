import { Search, Bell, Sun, Moon, Command, HelpCircle, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function AppTopbar() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex flex-1 items-center gap-3">
        <button className="group flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40 transition">
          <Search className="size-4" />
          <span className="flex-1 text-left">Search samples, reports, instruments…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
            <Command className="size-3" />K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Help">
          <HelpCircle className="size-4" />
        </button>
        <button
          onClick={() => setDark((d) => !d)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <Link to="/app/notifications" className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">5</span>
        </Link>
        <div className="ml-2 flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm">
          <div className="grid size-6 place-items-center rounded-full gradient-primary text-[10px] font-semibold text-white">AN</div>
          <span className="hidden md:inline font-medium">Adaeze</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
