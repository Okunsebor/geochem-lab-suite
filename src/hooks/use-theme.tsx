import { useTheme as useNewTheme } from "../components/ThemeProvider";

export function useTheme() {
  const { theme, setTheme } = useNewTheme();

  // Map "system" theme to active dark/light boolean
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return {
    dark: isDark,
    setDark: (val: boolean | ((prev: boolean) => boolean)) => {
      const newVal = typeof val === "function" ? val(isDark) : val;
      setTheme(newVal ? "dark" : "light");
    },
    toggleDark,
  };
}

/** Inline script for RootShell — prevents light-mode flash before React hydrates. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("geochem-ui-theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

