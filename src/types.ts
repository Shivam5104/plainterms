export type FindingSeverity = "critical" | "watch" | "fair";

export type ReplyTone = "collaborative" | "balanced" | "firm";

export type AppView = "workbench" | "test-notes";

export interface ClauseFinding {
  id: string;
  exactQuote: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  plainEnglish: string;
  impact: string;
  suggestedAsk: string;
}

export interface AnalysisResult {
  documentType: string;
  summary: string;
  bottomLine: string;
  findings: ClauseFinding[];
}

export interface DraftReplyResult {
  subject: string;
  body: string;
  keyPoints: string[];
  generatedForIds?: string[];
}

export interface DocumentPreset {
  id: string;
  label: string;
  documentType: string;
  summaryHint: string;
  rawText: string;
  initialAnalysis?: AnalysisResult;
}

export interface TestObservation {
  id: string;
  testerLabel: string;
  presetTested: string;
  whatHappened: string;
  plannedIteration: string;
  createdAt: string;
}
