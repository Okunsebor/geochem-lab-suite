import { Sun, Moon, HelpCircle, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentUser, logout } = useLimsState();

  const initials =
    currentUser?.name
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2) || "US";
  const firstName = currentUser?.name?.split(" ")[0] || "User";

  // Persist dark mode and prevent flashes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("gcs_dark_mode", String(dark));
  }, [dark]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  return (
    <div className="flex items-center gap-1 shrink-0 relative" ref={menuRef}>
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

      <div className="relative ml-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-sm select-none cursor-pointer hover:bg-muted/50 transition active:scale-98"
        >
          <div className="grid size-6 place-items-center rounded-full gradient-primary text-[10px] font-semibold text-white">
            {initials}
          </div>
          <span className="hidden md:inline font-medium text-foreground">{firstName}</span>
          <ChevronDown
            className="size-3.5 text-muted-foreground transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            <div className="px-2 py-1.5 border-b border-border/60 mb-1">
              <p className="text-xs font-semibold text-foreground truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                toast.info("Profile page coming soon.");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
            >
              <UserIcon className="size-3.5 text-muted-foreground" />
              My Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
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
  );
}
