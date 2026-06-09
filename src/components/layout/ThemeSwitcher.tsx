import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
      <button
        onClick={() => setTheme("light")}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Light Theme"
      >
        <Sun className="size-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Dark Theme"
      >
        <Moon className="size-4" />
      </button>
      <button
        onClick={() => setTheme("blue")}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === "blue"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Blue Theme"
      >
        <div className="size-3.5 rounded-full bg-[#00AEEF] border border-black/20" />
      </button>
      <button
        onClick={() => setTheme("gold")}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === "gold"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Gold Theme"
      >
        <div className="size-3.5 rounded-full bg-[#F5B800] border border-black/20" />
      </button>
    </div>
  );
}
