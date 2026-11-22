import { Moon, Sun } from "lucide-react";

export type ThemeMode = "light" | "dark";

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400"
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
          <span>Dark mode</span>
        </>
      )}
    </button>
  );
}
