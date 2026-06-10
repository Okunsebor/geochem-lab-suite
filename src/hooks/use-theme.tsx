import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "gcs_dark_mode";

type ThemeContextValue = {
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(readStoredDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, String(dark));
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, [dark]);

  const toggleDark = useCallback(() => {
    setDark((value) => !value);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/** Inline script for RootShell — prevents light-mode flash before React hydrates. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=localStorage.getItem("${THEME_STORAGE_KEY}")==="true";document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
