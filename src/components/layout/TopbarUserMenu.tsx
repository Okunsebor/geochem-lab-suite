import { Sun, Moon, HelpCircle, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLimsState } from "@/hooks/use-lims-state";
import { toast } from "sonner";
import { TopbarNotifications } from "./TopbarNotifications";

export function TopbarUserMenu() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("gcs_dark_mode");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const { currentUser } = useLimsState();

  const initials = currentUser?.name?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "US";
  const firstName = currentUser?.name?.split(" ")[0] || "User";

  // Persist dark mode and prevent flashes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("gcs_dark_mode", String(dark));
  }, [dark]);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button 
        onClick={() => toast.info("Help Center documentation coming soon.")}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" 
        aria-label="Help"
      >
        <HelpCircle className="size-4" />
      </button>
      <button
        onClick={() => setDark((d) => !d)}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        aria-label="Toggle theme"
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      
      <TopbarNotifications />

      <div className="ml-2 flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm select-none">
        <div className="grid size-6 place-items-center rounded-full gradient-primary text-[10px] font-semibold text-white">{initials}</div>
        <span className="hidden md:inline font-medium text-foreground">{firstName}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
