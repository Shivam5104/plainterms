import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TestObservation } from "../types";
import { ThemeMode, ThemeToggle } from "./ThemeToggle";

interface TestNotesViewProps {
  observations: TestObservation[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onAddObservation: (obs: Omit<TestObservation, "id" | "createdAt">) => void;
  onDeleteObservation: (id: string) => void;
}

export function TestNotesView({
  observations,
  theme,
  onToggleTheme,
  onAddObservation,
  onDeleteObservation,
}: TestNotesViewProps) {
  const [testerLabel, setTesterLabel] = useState("");
  const [presetTested, setPresetTested] = useState("Startup Equity Offer");
  const [whatHappened, setWhatHappened] = useState("");
  const [plannedIteration, setPlannedIteration] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerLabel.trim() || !whatHappened.trim() || !plannedIteration.trim()) {
      return;
    }
    onAddObservation({
      testerLabel: testerLabel.trim(),
      presetTested: presetTested.trim(),
      whatHappened: whatHappened.trim(),
      plannedIteration: plannedIteration.trim(),
    });
    setTesterLabel("");
    setWhatHappened("");
    setPlannedIteration("");
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Buildathon Iteration Log · Stored locally in browser
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
            First-Test Observations &amp; Changes
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Capture what surprised you when someone tried PlainTerms for the first time, and turn each friction point into a concrete next change for your Buildathon demo story.
          </p>
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 transition-colors duration-150"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Log a Test Session
          </h2>

          <div>
            <label
              htmlFor="tester-label"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Tester Context
            </label>
            <input
              id="tester-label"
              type="text"
              required
              value={testerLabel}
              onChange={(e) => setTesterLabel(e.target.value)}
              placeholder="e.g., Friend reviewing new job offer"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-700 dark:focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="preset-tested"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Document Tested
            </label>
            <select
              id="preset-tested"
              value={presetTested}
              onChange={(e) => setPresetTested(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-700 dark:focus:border-blue-500 focus:outline-none"
            >
              <option value="Startup Equity Offer">Startup Equity Offer</option>
              <option value="Apartment Lease">Apartment Lease</option>
              <option value="Freelance Scope">Freelance Scope</option>
              <option value="SaaS Auto-Renewal">SaaS Auto-Renewal</option>
              <option value="Custom Pasted Document">Custom Pasted Document</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="what-happened"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              What Happened / Friction Point
            </label>
            <textarea
              id="what-happened"
              required
              rows={3}
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="What confused the tester or made them hesitate?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-700 dark:focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="planned-iteration"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              What Changed / Next Iteration
            </label>
            <textarea
              id="planned-iteration"
              required
              rows={3}
              value={plannedIteration}
              onChange={(e) => setPlannedIteration(e.target.value)}
              placeholder="How did you adjust the UI or prompt?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-700 dark:focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 dark:hover:bg-blue-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Save Observation</span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 transition-colors duration-150">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Recorded Sessions
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {observations.length} entries
            </span>
          </div>

          {observations.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No test observations recorded yet. Add your first session on the left.
            </p>
          ) : (
            observations.map((obs) => (
              <article key={obs.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {obs.testerLabel}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{obs.presetTested}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{obs.createdAt}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete observation by ${obs.testerLabel}`}
                    onClick={() => onDeleteObservation(obs.id)}
                    className="rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Finding:
                  </span>{" "}
                  {obs.whatHappened}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Iteration:
                  </span>{" "}
                  {obs.plannedIteration}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
