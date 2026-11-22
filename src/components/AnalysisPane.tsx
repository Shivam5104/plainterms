import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Check,
  Mail,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import {
  AnalysisResult,
  ClauseFinding,
  DraftReplyResult,
  FindingSeverity,
  ReplyTone,
} from "../types";

interface AnalysisPaneProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  hasUnanalyzedEdits: boolean;
  matchedIds: Set<string>;
  selectedFindingId: string | null;
  selectedForReplyIds: Set<string>;
  replyTone: ReplyTone;
  draftReply: DraftReplyResult | null;
  isDrafting: boolean;
  draftError: string | null;
  onRetryAnalyze: () => void;
  onSelectFinding: (finding: ClauseFinding) => void;
  onToggleReplySelection: (id: string) => void;
  onChangeTone: (tone: ReplyTone) => void;
  onGenerateReply: () => void;
}

type RightTab = "findings" | "reply";
type SeverityFilter = "all" | FindingSeverity;

const SEVERITY_META: Record<
  FindingSeverity,
  { label: string; textClass: string; Icon: typeof ShieldAlert }
> = {
  critical: {
    label: "Critical Catch",
    textClass: "text-red-700 dark:text-red-400",
    Icon: ShieldAlert,
  },
  watch: {
    label: "Watch Out",
    textClass: "text-amber-700 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  fair: {
    label: "Standard Term",
    textClass: "text-emerald-700 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
};

export function AnalysisPane({
  analysis,
  isAnalyzing,
  analyzeError,
  hasUnanalyzedEdits,
  matchedIds,
  selectedFindingId,
  selectedForReplyIds,
  replyTone,
  draftReply,
  isDrafting,
  draftError,
  onRetryAnalyze,
  onSelectFinding,
  onToggleReplySelection,
  onChangeTone,
  onGenerateReply,
}: AnalysisPaneProps) {
  const [activeTab, setActiveTab] = useState<RightTab>("findings");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const findings = analysis?.findings ?? [];
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const watchCount = findings.filter((f) => f.severity === "watch").length;
  const fairCount = findings.filter((f) => f.severity === "fair").length;
  const selectedFindings = findings.filter((f) =>
    selectedForReplyIds.has(f.id)
  );

  const isDraftStale = Boolean(
    draftReply &&
      (draftReply.generatedForIds?.length !== selectedFindings.length ||
        !selectedFindings.every((f) =>
          draftReply.generatedForIds?.includes(f.id)
        ))
  );

  const filteredFindings =
    severityFilter === "all"
      ? findings
      : findings.filter((f) => f.severity === severityFilter);

  const handleCopyEmail = async () => {
    if (!draftReply) return;
    const fullText = `Subject: ${draftReply.subject}\n\n${draftReply.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      setCopiedEmail(false);
    }
  };

  return (
    <section
      aria-label="Clause Analysis and Negotiation Reply"
      className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-150"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Analysis Workspace Views"
            className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "findings"}
              onClick={() => setActiveTab("findings")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "findings"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Clause Findings
              {findings.length > 0 ? ` (${findings.length})` : ""}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reply"}
              onClick={() => setActiveTab("reply")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "reply"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                Pushback Draft
                {selectedForReplyIds.size > 0
                  ? ` (${selectedForReplyIds.size})`
                  : ""}
              </span>
            </button>
          </div>

          {findings.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {criticalCount} Critical
              </span>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {watchCount} Watch
              </span>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {fairCount} Fair
              </span>
            </div>
          )}
        </div>

        {analysis && !isAnalyzing && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {analysis.summary}
            </p>
            <p className="mt-1.5 text-xs font-medium text-slate-900 dark:text-slate-100">
              Priority check: {analysis.bottomLine}
            </p>
            {hasUnanalyzedEdits && (
              <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                Document text changed since this scan. Click &ldquo;Analyze Clauses&rdquo; to refresh findings.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto lg:max-h-[calc(100vh-230px)]">
        {analyzeError && (
          <div
            role="alert"
            className="m-5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Analysis could not complete
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-800 dark:text-red-300">
                  {analyzeError}
                </p>
              </div>
              <button
                type="button"
                onClick={onRetryAnalyze}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-red-800 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {isAnalyzing ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 px-5 py-2" aria-busy="true">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="py-4 animate-pulse">
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2.5 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="mt-1.5 h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        ) : activeTab === "findings" ? (
          findings.length === 0 ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ready to inspect clauses
              </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Select a sample preset or paste your own text on the left, then click Analyze Clauses to anchor risks directly to exact sentences.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { id: "all", label: "All Clauses" },
                      { id: "critical", label: "Critical" },
                      { id: "watch", label: "Watch Out" },
                      { id: "fair", label: "Standard" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSeverityFilter(tab.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        severityFilter === tab.id
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("reply")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Build reply</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredFindings.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No clauses match this severity filter.
                  </p>
                ) : (
                  filteredFindings.map((finding) => {
                    const meta = SEVERITY_META[finding.severity];
                    const SeverityIcon = meta.Icon;
                    const isSelected = finding.id === selectedFindingId;
                    const isAnchored = matchedIds.has(finding.id);
                    const isChecked = selectedForReplyIds.has(finding.id);

                    return (
                      <article
                        key={finding.id}
                        className={`px-5 py-4 transition-colors duration-150 ${
                          isSelected
                            ? "bg-blue-50/60 dark:bg-blue-950/40"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectFinding(finding)}
                            className="flex-1 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-400"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${meta.textClass}`}
                              >
                                <SeverityIcon
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                {meta.label}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {finding.category}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {isAnchored ? "Anchored in text" : "Summary note"}
                              </span>
                            </div>

                            <h3 className="mt-1.5 text-[15px] font-semibold text-slate-900 dark:text-slate-50">
                              {finding.title}
                            </h3>

                            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              {finding.plainEnglish}
                            </p>

                            <dl className="mt-3 space-y-1 text-xs">
                              <div className="flex gap-1.5">
                                <dt className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                  Impact:
                                </dt>
                                <dd className="text-slate-600 dark:text-slate-400">
                                  {finding.impact}
                                </dd>
                              </div>
                              <div className="flex gap-1.5">
                                <dt className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                  Suggested edit:
                                </dt>
                                <dd className="text-slate-800 dark:text-slate-200">
                                  {finding.suggestedAsk}
                                </dd>
                              </div>
                            </dl>
                          </button>

                          <label className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleReplySelection(finding.id)}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Include</span>
                          </label>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Compose Negotiation Reply
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    Generates a concise email targeting your{" "}
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {selectedForReplyIds.size}
                    </span>{" "}
                    checked clause{selectedForReplyIds.size === 1 ? "" : "s"}.
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Reply Tone"
                  className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5"
                >
                  {(
                    [
                      { id: "collaborative", label: "Collaborative" },
                      { id: "balanced", label: "Balanced" },
                      { id: "firm", label: "Firm" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeTone(t.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        replyTone === t.id
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {findings.length > 0 && (
                <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {findings.map((finding) => {
                    const checked = selectedForReplyIds.has(finding.id);
                    const meta = SEVERITY_META[finding.severity];
                    return (
                      <label
                        key={finding.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleReplySelection(finding.id)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500 shrink-0"
                          />
                          <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {finding.title}
                          </span>
                        </div>
                        <span className={`shrink-0 font-medium ${meta.textClass}`}>
                          {meta.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onGenerateReply}
                  disabled={isDrafting || selectedForReplyIds.size === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800 dark:hover:bg-blue-500 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isDrafting
                      ? "Drafting Reply..."
                      : draftReply
                        ? "Update Pushback Email"
                        : "Draft Pushback Email"}
                  </span>
                </button>

                {isDraftStale && !isDrafting && (
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Clause selection changed — click Update Pushback Email to refresh the draft.
                  </span>
                )}
              </div>
            </div>

            {draftError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 p-3.5 text-xs text-red-800 dark:text-red-300"
              >
                {draftError}
              </div>
            )}

            {draftReply && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject:{" "}
                    <span className="font-normal text-slate-900 dark:text-slate-100">
                      {draftReply.subject}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3">
                  {draftReply.body
                    .split(/\n{2,}/)
                    .map((block) => block.trim())
                    .filter(Boolean)
                    .map((block, idx) => {
                      const lines = block
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean);
                      const isBulletBlock = lines.every((l) =>
                        /^[-•*]\s+/.test(l)
                      );
                      if (isBulletBlock) {
                        return (
                          <ul key={idx} className="space-y-2 pl-5 list-disc">
                            {lines.map((line, lineIdx) => (
                              <li key={lineIdx} className="leading-relaxed">
                                {line.replace(/^[-•*]\s+/, "")}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="whitespace-pre-line">
                          {block}
                        </p>
                      );
                    })}
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Key negotiation asks included
                    </p>
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {selectedFindings.length} selected
                    </span>
                  </div>
                  {selectedFindings.length === 0 ? (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      No clauses currently selected. Check one or more clauses above to include them.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                      {selectedFindings.map((finding) => (
                        <li key={finding.id} className="leading-relaxed">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {finding.title}:
                          </span>{" "}
                          {finding.suggestedAsk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
