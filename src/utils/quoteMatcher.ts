import { ClauseFinding, FindingSeverity } from "../types";

export interface MatchedSegment {
  text: string;
  finding?: ClauseFinding;
}

const SEVERITY_PRIORITY: Record<FindingSeverity, number> = {
  critical: 3,
  watch: 2,
  fair: 1,
};

function findQuoteIndex(
  haystack: string,
  needle: string
): { start: number; end: number } | null {
  if (!needle || needle.trim().length < 6) {
    return null;
  }

  const exactIdx = haystack.indexOf(needle);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + needle.length };
  }

  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const ciIdx = lowerHaystack.indexOf(lowerNeedle);
  if (ciIdx !== -1) {
    return { start: ciIdx, end: ciIdx + needle.length };
  }

  const tokens = needle.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 3) {
    return null;
  }

  const escapedTokens = tokens.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = escapedTokens.join("\\s+");
  try {
    const regex = new RegExp(pattern, "i");
    const match = regex.exec(haystack);
    if (match && match.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length };
    }
  } catch {
    return null;
  }

  return null;
}

export function buildAnchoredSegments(
  documentText: string,
  findings: ClauseFinding[]
): { segments: MatchedSegment[]; matchedIds: Set<string> } {
  const matchedIds = new Set<string>();
  const rawSpans: Array<{
    start: number;
    end: number;
    finding: ClauseFinding;
  }> = [];

  for (const finding of findings) {
    const found = findQuoteIndex(documentText, finding.exactQuote);
    if (found) {
      matchedIds.add(finding.id);
      rawSpans.push({ ...found, finding });
    }
  }

  rawSpans.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (
      SEVERITY_PRIORITY[b.finding.severity] -
      SEVERITY_PRIORITY[a.finding.severity]
    );
  });

  const nonOverlapping: typeof rawSpans = [];
  for (const span of rawSpans) {
    const prev = nonOverlapping[nonOverlapping.length - 1];
    if (!prev || span.start >= prev.end) {
      nonOverlapping.push(span);
    } else if (
      SEVERITY_PRIORITY[span.finding.severity] >
      SEVERITY_PRIORITY[prev.finding.severity]
    ) {
      nonOverlapping[nonOverlapping.length - 1] = span;
    }
  }

  const segments: MatchedSegment[] = [];
  let cursor = 0;

  for (const span of nonOverlapping) {
    if (span.start > cursor) {
      segments.push({ text: documentText.slice(cursor, span.start) });
    }
    segments.push({
      text: documentText.slice(span.start, span.end),
      finding: span.finding,
    });
    cursor = span.end;
  }

  if (cursor < documentText.length) {
    segments.push({ text: documentText.slice(cursor) });
  }

  return { segments, matchedIds };
}
