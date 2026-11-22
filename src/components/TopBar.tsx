import { AppView } from "../types";

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onStartCustom: () => void;
}

export function TopBar({
  activeView,
  onNavigate,
  onStartCustom,
}: TopBarProps) {
  const navItems: Array<{ id: AppView; label: string }> = [
    { id: "workbench", label: "Workbench" },
    { id: "test-notes", label: "Test Notes" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-150">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#workbench"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("workbench");
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400"
        >
          PlainTerms
        </a>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-6"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`border-b-2 py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400 ${
                  isActive
                    ? "border-blue-700 dark:border-blue-400 text-slate-900 dark:text-slate-50"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onStartCustom}
            className="rounded-lg bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800 dark:hover:bg-blue-500 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400"
          >
            Paste Custom Text
          </button>
        </div>
      </div>
    </header>
  );
}
