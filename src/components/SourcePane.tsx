import { useEffect, useRef } from "react";
import { FileEdit, Eye, Sparkles, RotateCcw } from "lucide-react";
import {
  ClauseFinding,
  DocumentPreset,
  FindingSeverity,
} from "../types";
import { MatchedSegment } from "../utils/quoteMatcher";

interface SourcePaneProps {
  presets: DocumentPreset[];
  activePresetId: string | null;
  documentText: string;
  documentTitle: string;
  isEditMode: boolean;
  isAnalyzing: boolean;
  hasUnanalyzedEdits: boolean;
  segments: MatchedSegment[];
  matchedCount: number;
  totalFindings: number;
  selectedFindingId: string | null;
  highlightPulseKey: number;
  onSelectPreset: (preset: DocumentPreset) => void;
  onChangeText: (text: string) => void;
  onToggleMode: (editMode: boolean) => void;
  onAnalyze: () => void;
  onSelectFinding: (finding: ClauseFinding) => void;
  onClearText: () => void;
}

const MARK_STYLES: Record<
  FindingSeverity,
  { base: string; selected: string }
> = {
  critical: {
    base: "bg-red-50/90 dark:bg-red-950/60 text-red-950 dark:text-red-100 border-b-2 border-red-600 dark:border-red-400 hover:bg-red-100/90 dark:hover:bg-red-900/70",
    selected:
      "bg-red-100 dark:bg-red-900/80 text-red-950 dark:text-white border-b-2 border-red-700 dark:border-red-300 ring-2 ring-blue-700 dark:ring-blue-400",
  },
  watch: {
    base: "bg-amber-50/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 border-b-2 border-amber-500 dark:border-amber-400 hover:bg-amber-100/90 dark:hover:bg-amber-900/70",
    selected:
      "bg-amber-100 dark:bg-amber-900/80 text-amber-950 dark:text-white border-b-2 border-amber-600 dark:border-amber-300 ring-2 ring-blue-700 dark:ring-blue-400",
  },
  fair: {
    base: "bg-emerald-50/80 dark:bg-emerald-950/55 text-emerald-950 dark:text-emerald-100 border-b-2 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/70",
    selected:
      "bg-emerald-100 dark:bg-emerald-900/75 text-emerald-950 dark:text-white border-b-2 border-emerald-700 dark:border-emerald-300 ring-2 ring-blue-700 dark:ring-blue-400",
  },
};

export function SourcePane({
  presets,
  activePresetId,
  documentText,
  documentTitle,
  isEditMode,
  isAnalyzing,
  hasUnanalyzedEdits,
  segments,
  matchedCount,
  totalFindings,
  selectedFindingId,
  highlightPulseKey,
  onSelectPreset,
  onChangeText,
  onToggleMode,
  onAnalyze,
  onSelectFinding,
  onClearText,
}: SourcePaneProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!selectedFindingId || isEditMode) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-finding-id="${selectedFindingId}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedFindingId, highlightPulseKey, isEditMode]);

  useEffect(() => {
    if (isEditMode && documentText.trim() === "" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditMode, documentText]);

  const charCount = documentText.trim().length;
  const wordCount = documentText.trim()
    ? documentText.trim().split(/\s+/).length
    : 0;

  return (
    <section
      aria-label="Source Document Sandbox"
      className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-150"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {presets.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => onSelectPreset(preset)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400 ${
                    active
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 border border-transparent hover:bg-white/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Document View Mode"
              className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5"
            >
              <button
                type="button"
                onClick={() => onToggleMode(false)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  !isEditMode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Highlighted</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleMode(true)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isEditMode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit Text</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {documentTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{wordCount} words</span>
              <span aria-hidden="true"> · </span>
              <span>{charCount} chars</span>
              {totalFindings > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>
                    {matchedCount}/{totalFindings} clauses anchored
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {documentText.length > 0 && (
              <button
                type="button"
                onClick={onClearText}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing || charCount < 20}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-slate-800 dark:hover:bg-blue-500 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAnalyzing
                  ? "Analyzing..."
                  : hasUnanalyzedEdits
                    ? "Analyze Clauses"
                    : "Re-Analyze Live"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-5 lg:max-h-[calc(100vh-230px)]"
      >
        {isEditMode ? (
          <div className="flex h-full flex-col">
            <label htmlFor="fine-print-editor" className="sr-only">
              Contract or fine-print text
            </label>
            <textarea
              ref={textareaRef}
              id="fine-print-editor"
              value={documentText}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Paste any lease clause, job offer letter, freelance contract, or SaaS terms here (at least 20 characters), then click Analyze Clauses..."
              className="min-h-[420px] w-full flex-1 resize-y rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-950 p-4 text-[15px] leading-[1.7] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-700 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Edits switch automatically to highlighted mode once analyzed.
              </span>
              {charCount < 20 && (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Enter at least 20 characters to run analysis
                </span>
              )}
            </div>
          </div>
        ) : documentText.trim().length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center px-6">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No document loaded yet
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Pick one of the sample presets above to inspect real clauses immediately, or paste your own text.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggleMode(true)}
                className="rounded-lg bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 dark:hover:bg-blue-500 cursor-pointer"
              >
                Paste Custom Text
              </button>
              <button
                type="button"
                onClick={() => onSelectPreset(presets[0])}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Load Startup Offer Preset
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-slate-800 dark:text-slate-200">
            {segments.map((seg, index) => {
              if (!seg.finding) {
                return <span key={`text-${index}`}>{seg.text}</span>;
              }
              const isSelected = seg.finding.id === selectedFindingId;
              const style = MARK_STYLES[seg.finding.severity];
              return (
                <mark
                  key={`${seg.finding.id}-${index}-${isSelected ? highlightPulseKey : 0}`}
                  data-finding-id={seg.finding.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectFinding(seg.finding!)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectFinding(seg.finding!);
                    }
                  }}
                  title={`${seg.finding.title} — Click to inspect`}
                  className={`cursor-pointer rounded-xs px-0.5 py-0.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400 ${
                    isSelected
                      ? `${style.selected} clause-focus-pulse`
                      : style.base
                  }`}
                >
                  {seg.text}
                </mark>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
