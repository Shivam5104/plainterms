import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_ID = "gemini-4-hydrogen";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw Object.assign(
      new Error(
        "GEMINI_API_KEY is not configured. Add a valid key in Settings > Secrets to run live clause analysis."
      ),
      { statusCode: 500 }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: number }).status)
          : 0;
      const isRetryable = status === 429 || status === 503 || status === 500;
      if (!isRetryable || attempt === maxRetries) {
        break;
      }
      const delayMs = 450 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  if (
    err instanceof Error &&
    "statusCode" in err &&
    typeof (err as Error & { statusCode?: unknown }).statusCode === "number"
  ) {
    return {
      status: (err as Error & { statusCode: number }).statusCode,
      message: err.message,
    };
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status?: number }).status)
      : 502;

  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("PERMISSION_DENIED") || status === 403) {
    return {
      status: 403,
      message: "Gemini API key is invalid or unauthorized. Verify GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (rawMessage.includes("RESOURCE_EXHAUSTED") || status === 429) {
    return {
      status: 429,
      message: "Gemini API rate limit reached. Wait a few seconds and retry.",
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 502,
    message: rawMessage || "Failed to process request with Gemini.",
  };
}

const analyzeSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      description: "Short label for the document type, e.g. Startup Offer Letter, Residential Lease, SaaS Terms.",
    },
    summary: {
      type: Type.STRING,
      description: "Two clear sentences summarizing what this document commits the reader to.",
    },
    bottomLine: {
      type: Type.STRING,
      description: "One concrete next step or top priority before signing or agreeing.",
    },
    findings: {
      type: Type.ARRAY,
      description: "4 to 7 key clauses extracted directly from the source text.",
      items: {
        type: Type.OBJECT,
        properties: {
          exactQuote: {
            type: Type.STRING,
            description:
              "Verbatim contiguous substring copied character-for-character from the input text (10 to 45 words). Never paraphrase or alter punctuation.",
          },
          severity: {
            type: Type.STRING,
            description: "Must be one of: critical, watch, fair",
          },
          category: {
            type: Type.STRING,
            description: "Short 1 to 3 word clause topic, e.g. IP Assignment, Auto-Renewal, Fee Penalty.",
          },
          title: {
            type: Type.STRING,
            description: "Concise 4 to 8 word plain-English headline for the clause.",
          },
          plainEnglish: {
            type: Type.STRING,
            description: "1 to 2 sentences explaining what this clause actually means in everyday language.",
          },
          impact: {
            type: Type.STRING,
            description: "Concrete financial, timeline, or rights impact (e.g. 'Costs 2 months rent ($5,400)' or 'Locks in for 12 months').",
          },
          suggestedAsk: {
            type: Type.STRING,
            description: "Specific amendment, carve-out, or clarification to request.",
          },
        },
        required: [
          "exactQuote",
          "severity",
          "category",
          "title",
          "plainEnglish",
          "impact",
          "suggestedAsk",
        ],
      },
    },
  },
  required: ["documentType", "summary", "bottomLine", "findings"],
};

const draftReplySchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: "Concise, professional email subject line.",
    },
    opening: {
      type: Type.STRING,
      description:
        "Brief greeting (e.g. 'Hi [Name],') followed by a blank line and 1-2 polite opening sentences introducing the requested edits.",
    },
    negotiationBullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Exactly one concise bullet item per clause listed in the prompt, in the same order, without leading bullet symbols or numbers. State the clause topic and specific requested adjustment.",
    },
    closing: {
      type: Type.STRING,
      description:
        "1-2 polite closing sentences followed by a blank line and sign-off (e.g. 'Best,\\n[Your Name]').",
    },
  },
  required: ["subject", "opening", "negotiationBullets", "closing"],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { documentText, contextLabel } = req.body as {
        documentText?: unknown;
        contextLabel?: unknown;
      };

      if (typeof documentText !== "string" || documentText.trim().length < 20) {
        res.status(400).json({
          error: "Please provide at least 20 characters of contract, policy, or fine-print text to analyze.",
        });
        return;
      }

      if (documentText.length > 40000) {
        res.status(400).json({
          error: "Document exceeds the 40,000-character limit for this workbench demo. Trim to the relevant sections.",
        });
        return;
      }

      const ai = getGeminiClient();
      const labelHint =
        typeof contextLabel === "string" && contextLabel.trim().length > 0
          ? `Document context hint: ${contextLabel.trim()}\n\n`
          : "";

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `${labelHint}Analyze the following fine-print document and extract 4 to 7 key clauses.\n\nSOURCE DOCUMENT:\n"""\n${documentText}\n"""`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              "You are PlainTerms, a precise legal-clarity analyst helping everyday people understand fine print before signing. " +
              "Extract 4 to 7 consequential clauses from the SOURCE DOCUMENT. Include genuine red flags ('critical'), negotiable or asymmetrical terms ('watch'), and at least one balanced or standard term ('fair') when present so the reader has calibrated context. " +
              "CRITICAL RULE: Every 'exactQuote' MUST be an exact, verbatim, character-for-character substring copied directly from SOURCE DOCUMENT without ellipses, paraphrasing, or altered punctuation, so the interface can highlight it inline. Keep each exactQuote between 10 and 45 words.",
            responseMimeType: "application/json",
            responseSchema: analyzeSchema,
          },
        })
      );

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson) as {
        documentType?: string;
        summary?: string;
        bottomLine?: string;
        findings?: Array<{
          exactQuote?: string;
          severity?: string;
          category?: string;
          title?: string;
          plainEnglish?: string;
          impact?: string;
          suggestedAsk?: string;
        }>;
      };

      const validSeverities = new Set(["critical", "watch", "fair"]);
      const findings = (parsed.findings ?? []).map((item, idx) => ({
        id: `finding-${Date.now()}-${idx + 1}`,
        exactQuote: String(item.exactQuote ?? "").trim(),
        severity: validSeverities.has(String(item.severity))
          ? (item.severity as "critical" | "watch" | "fair")
          : "watch",
        category: String(item.category ?? "Clause").trim(),
        title: String(item.title ?? "Reviewed Clause").trim(),
        plainEnglish: String(item.plainEnglish ?? "").trim(),
        impact: String(item.impact ?? "").trim(),
        suggestedAsk: String(item.suggestedAsk ?? "").trim(),
      }));

      res.json({
        documentType: String(parsed.documentType ?? "Fine-Print Document").trim(),
        summary: String(parsed.summary ?? "").trim(),
        bottomLine: String(parsed.bottomLine ?? "").trim(),
        findings,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/draft-reply", async (req, res) => {
    try {
      const { documentType, selectedFindings, tone } = req.body as {
        documentType?: unknown;
        selectedFindings?: unknown;
        tone?: unknown;
      };

      if (!Array.isArray(selectedFindings) || selectedFindings.length === 0) {
        res.status(400).json({
          error: "Select at least one clause finding to include in your pushback reply.",
        });
        return;
      }

      const safeTone =
        tone === "collaborative" || tone === "firm" || tone === "balanced"
          ? tone
          : "balanced";

      const ai = getGeminiClient();

      const toneGuide =
        safeTone === "collaborative"
          ? "Warm, appreciative, and partnership-oriented—assume good faith while asking for clear edits."
          : safeTone === "firm"
            ? "Direct, concise, and unambiguous—state exact required redlines before signing."
            : "Polite, professional, and grounded—clearly explain why each edit protects both sides.";

      const clausesText = selectedFindings
        .slice(0, 8)
        .map(
          (f: { title?: string; exactQuote?: string; suggestedAsk?: string }, i: number) =>
            `${i + 1}. ${String(f.title ?? "Clause")}\n   Quoted text: "${String(f.exactQuote ?? "")}"\n   Requested adjustment: ${String(f.suggestedAsk ?? "")}`
        )
        .join("\n\n");

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Document type: ${String(documentType ?? "Agreement")}\nRequested tone: ${safeTone} (${toneGuide})\n\nSelected clauses to address (generate exactly ${Math.min(selectedFindings.length, 8)} negotiationBullets matching these in order):\n${clausesText}\n\nWrite a practical, ready-to-send email requesting these adjustments.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              "You write concise, practical negotiation emails for regular people responding to contracts, leases, or offer letters. " +
              "Avoid legalese and fluff. Use placeholders like [Name] or [Company] only where genuinely unknown. " +
              "Return one crisp item in negotiationBullets for each selected clause, keeping each bullet under 35 words.",
            responseMimeType: "application/json",
            responseSchema: draftReplySchema,
          },
        })
      );

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson) as {
        subject?: string;
        opening?: string;
        negotiationBullets?: string[];
        closing?: string;
      };

      const cleanBullets = Array.isArray(parsed.negotiationBullets)
        ? parsed.negotiationBullets
            .map((b) =>
              String(b)
                .replace(/^[\s•*\-–]+|^\d+[.)]\s*/, "")
                .trim()
            )
            .filter(Boolean)
        : [];

      const bulletBlock = cleanBullets.map((b) => `- ${b}`).join("\n");
      const opening = String(parsed.opening ?? "").trim();
      const closing = String(parsed.closing ?? "").trim();
      const body = [opening, bulletBlock, closing].filter(Boolean).join("\n\n");

      res.json({
        subject: String(parsed.subject ?? "Questions on agreement terms").trim(),
        body,
        keyPoints: cleanBullets,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlainTerms server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
