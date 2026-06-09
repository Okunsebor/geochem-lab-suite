import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "blue" | "gold";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "geochem-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
      }
      return defaultTheme;
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "theme-blue", "theme-gold");

    if (theme === "light") {
      // Light theme uses :root by default, no class needed, or we could add 'light'
      return;
    }

    if (theme === "blue") {
      root.classList.add("theme-blue");
    } else if (theme === "gold") {
      root.classList.add("theme-gold");
    } else if (theme === "dark") {
      root.classList.add("dark");
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
