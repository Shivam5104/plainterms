import { useEffect, useMemo, useState } from "react";
import { TopBar } from "./components/TopBar";
import { SourcePane } from "./components/SourcePane";
import { AnalysisPane } from "./components/AnalysisPane";
import { TestNotesView } from "./components/TestNotesView";
import { ThemeMode, ThemeToggle } from "./components/ThemeToggle";
import { DOCUMENT_PRESETS } from "./data/presets";
import { buildAnchoredSegments } from "./utils/quoteMatcher";
import {
  AnalysisResult,
  AppView,
  ClauseFinding,
  DocumentPreset,
  DraftReplyResult,
  ReplyTone,
  TestObservation,
} from "./types";

const TEST_NOTES_STORAGE_KEY = "plainterms_test_observations_v1";
const THEME_STORAGE_KEY = "plainterms_theme_v1";

const DEFAULT_OBSERVATIONS: TestObservation[] = [
  {
    id: "obs-seed-1",
    testerLabel: "Engineer reviewing offer letter",
    presetTested: "Startup Equity Offer",
    whatHappened:
      "Tester skimmed the summary card first, then asked: 'Wait, which exact paragraph gave away my weekend projects?'",
    plannedIteration:
      "Added click-to-scroll verbatim quote anchoring so clicking any finding pulses and highlights the exact triggering sentence in the source text.",
    createdAt: "Nov 22, 2026",
  },
  {
    id: "obs-seed-2",
    testerLabel: "Renter comparing apartment renewals",
    presetTested: "Apartment Lease",
    whatHappened:
      "Tester spotted the 60-day certified mail trap immediately, then paused and said 'Okay, how do I ask my landlord to change this without sounding hostile?'",
    plannedIteration:
      "Built the Pushback Draft tab with selectable clauses and a Collaborative / Balanced / Firm tone toggle.",
    createdAt: "Nov 22, 2026",
  },
];

function getInitialReplySelection(analysis: AnalysisResult | null): Set<string> {
  if (!analysis) return new Set();
  return new Set(
    analysis.findings
      .filter((f) => f.severity === "critical" || f.severity === "watch")
      .map((f) => f.id)
  );
}

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  } catch {
    // Fallback to light
  }
  return "light";
}

export default function App() {
  const openingPreset = DOCUMENT_PRESETS[0];

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [activeView, setActiveView] = useState<AppView>("workbench");
  const [activePresetId, setActivePresetId] = useState<string | null>(
    openingPreset.id
  );
  const [documentTitle, setDocumentTitle] = useState<string>(
    openingPreset.documentType
  );
  const [documentText, setDocumentText] = useState<string>(
    openingPreset.rawText
  );
  const [analyzedTextSnapshot, setAnalyzedTextSnapshot] = useState<string>(
    openingPreset.rawText
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    openingPreset.initialAnalysis ?? null
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    openingPreset.initialAnalysis?.findings[0]?.id ?? null
  );
  const [highlightPulseKey, setHighlightPulseKey] = useState<number>(0);

  const [selectedForReplyIds, setSelectedForReplyIds] = useState<Set<string>>(
    () => getInitialReplySelection(openingPreset.initialAnalysis ?? null)
  );
  const [replyTone, setReplyTone] = useState<ReplyTone>("balanced");
  const [draftReply, setDraftReply] = useState<DraftReplyResult | null>(null);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [observations, setObservations] = useState<TestObservation[]>(() => {
    try {
      const saved = localStorage.getItem(TEST_NOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TestObservation[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to initial seeded observations
    }
    return DEFAULT_OBSERVATIONS;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        TEST_NOTES_STORAGE_KEY,
        JSON.stringify(observations)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [observations]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const { segments, matchedIds } = useMemo(() => {
    return buildAnchoredSegments(documentText, analysis?.findings ?? []);
  }, [documentText, analysis]);

  const hasUnanalyzedEdits =
    documentText.trim().length > 0 &&
    documentText.trim() !== analyzedTextSnapshot.trim();

  async function runAnalysis(textToAnalyze: string, titleHint: string) {
    if (textToAnalyze.trim().length < 20) {
      setAnalyzeError(
        "Please enter at least 20 characters of text before analyzing."
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setDraftReply(null);
    setDraftError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: textToAnalyze,
          contextLabel: titleHint,
        }),
      });

      const payload = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok) {
        throw new Error(
          payload.error || `Server returned status ${res.status}`
        );
      }

      setAnalysis(payload);
      setDocumentTitle(payload.documentType || titleHint);
      setAnalyzedTextSnapshot(textToAnalyze);
      setIsEditMode(false);
      setSelectedFindingId(payload.findings[0]?.id ?? null);
      setSelectedForReplyIds(getInitialReplySelection(payload));
      setHighlightPulseKey((k) => k + 1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to connect to the analysis server.";
      setAnalyzeError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleSelectPreset = (preset: DocumentPreset) => {
    setActiveView("workbench");
    setActivePresetId(preset.id);
    setDocumentTitle(preset.documentType);
    setDocumentText(preset.rawText);
    setIsEditMode(false);
    setAnalyzeError(null);
    setDraftReply(null);
    setDraftError(null);

    if (preset.initialAnalysis) {
      setAnalysis(preset.initialAnalysis);
      setAnalyzedTextSnapshot(preset.rawText);
      setSelectedFindingId(preset.initialAnalysis.findings[0]?.id ?? null);
      setSelectedForReplyIds(getInitialReplySelection(preset.initialAnalysis));
      setHighlightPulseKey((k) => k + 1);
    } else {
      setAnalysis(null);
      setAnalyzedTextSnapshot("");
      setSelectedFindingId(null);
      setSelectedForReplyIds(new Set());
      void runAnalysis(preset.rawText, preset.documentType);
    }
  };

  const handleStartCustom = () => {
    setActiveView("workbench");
    setActivePresetId(null);
    setDocumentTitle("Custom Fine-Print Document");
    setDocumentText("");
    setAnalyzedTextSnapshot("");
    setAnalysis(null);
    setAnalyzeError(null);
    setDraftReply(null);
    setDraftError(null);
    setSelectedFindingId(null);
    setSelectedForReplyIds(new Set());
    setIsEditMode(true);
  };

  const handleChangeText = (nextText: string) => {
    setDocumentText(nextText);
    if (activePresetId !== null) {
      const currentPreset = DOCUMENT_PRESETS.find(
        (p) => p.id === activePresetId
      );
      if (currentPreset && currentPreset.rawText !== nextText) {
        setActivePresetId(null);
        setDocumentTitle("Custom Fine-Print Document");
      }
    }
  };

  const handleSelectFinding = (finding: ClauseFinding) => {
    setSelectedFindingId(finding.id);
    setIsEditMode(false);
    setHighlightPulseKey((k) => k + 1);
  };

  const handleToggleReplySelection = (id: string) => {
    setSelectedForReplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerateReply = async () => {
    if (!analysis || selectedForReplyIds.size === 0) return;

    const chosen = analysis.findings.filter((f) =>
      selectedForReplyIds.has(f.id)
    );
    setIsDrafting(true);
    setDraftError(null);

    try {
      const res = await fetch("/api/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: analysis.documentType,
          selectedFindings: chosen,
          tone: replyTone,
        }),
      });

      const payload = (await res.json()) as DraftReplyResult & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          payload.error || `Server returned status ${res.status}`
        );
      }

      setDraftReply({
        ...payload,
        generatedForIds: chosen.map((f) => f.id),
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to draft reply right now.";
      setDraftError(message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAddObservation = (
    obs: Omit<TestObservation, "id" | "createdAt">
  ) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setObservations((prev) => [
      {
        ...obs,
        id: `obs-${Date.now()}`,
        createdAt: formattedDate,
      },
      ...prev,
    ]);
  };

  const handleDeleteObservation = (id: string) => {
    setObservations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <TopBar
        activeView={activeView}
        onNavigate={setActiveView}
        onStartCustom={handleStartCustom}
      />

      {activeView === "workbench" && (
        <main className="mx-auto max-w-[1440px] px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                Fine-Print &amp; Clause Workbench
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Click any sample preset or paste your own agreement to inspect verbatim clause highlights and draft a clear pushback email.
              </p>
            </div>

            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <SourcePane
                presets={DOCUMENT_PRESETS}
                activePresetId={activePresetId}
                documentText={documentText}
                documentTitle={documentTitle}
                isEditMode={isEditMode}
                isAnalyzing={isAnalyzing}
                hasUnanalyzedEdits={hasUnanalyzedEdits}
                segments={segments}
                matchedCount={matchedIds.size}
                totalFindings={analysis?.findings.length ?? 0}
                selectedFindingId={selectedFindingId}
                highlightPulseKey={highlightPulseKey}
                onSelectPreset={handleSelectPreset}
                onChangeText={handleChangeText}
                onToggleMode={setIsEditMode}
                onAnalyze={() => runAnalysis(documentText, documentTitle)}
                onSelectFinding={handleSelectFinding}
                onClearText={handleStartCustom}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col">
              <AnalysisPane
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                analyzeError={analyzeError}
                hasUnanalyzedEdits={hasUnanalyzedEdits}
                matchedIds={matchedIds}
                selectedFindingId={selectedFindingId}
                selectedForReplyIds={selectedForReplyIds}
                replyTone={replyTone}
                draftReply={draftReply}
                isDrafting={isDrafting}
                draftError={draftError}
                onRetryAnalyze={() => runAnalysis(documentText, documentTitle)}
                onSelectFinding={handleSelectFinding}
                onToggleReplySelection={handleToggleReplySelection}
                onChangeTone={setReplyTone}
                onGenerateReply={handleGenerateReply}
              />
            </div>
          </div>
        </main>
      )}

      {activeView === "test-notes" && (
        <TestNotesView
          observations={observations}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onAddObservation={handleAddObservation}
          onDeleteObservation={handleDeleteObservation}
        />
      )}
    </div>
  );
}
