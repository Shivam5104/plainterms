# PlainTerms

An interactive split-pane fine-print and clause workbench built for the **Silicon Valley Buildathon** (submission deadline: December 15, 2026). Paste custom agreements or start from sample presets to inspect risk-rated clause findings anchored to verbatim source text, filter and select risky terms, generate tone-adjustable pushback emails, switch between light and dark mode, and log test observations in **Test Notes**.

## Key Features

- **Split-Pane Fine-Print Workbench:** View agreement text alongside structured clause findings, overall contract summaries, and priority negotiation checks.
- **Verbatim Quote Anchoring:** Ground findings in exact source quotes with visual highlighting and severity tags (`Critical Catch`, `Watch Out`, `Standard Term`).
- **Clause Filtering & Selection:** Filter findings by severity (`All Clauses`, `Critical`, `Watch Out`, `Standard`) and check/uncheck clauses to control what goes into a negotiation reply.
- **Tone-Adjustable Pushback Email Drafts:** Compose structured pushback emails across **Collaborative**, **Balanced**, and **Firm** tones with selectable clauses, a synced key-asks list, and one-click copy.
- **Light & Dark Mode:** Toggle between light and dark themes at any time with preference persistence in `localStorage`.
- **Test Notes (Iteration Log):** Record tester context, document tested, friction points, and follow-up UI/prompt iterations locally in the browser.

## Architecture Overview

- **Frontend:** Split-pane workbench UI with preset and custom text input, live clause/draft switching, and local session iteration logging.
- **AI & Schema Grounding:** Uses Gemini structured JSON outputs (`responseSchema`) to return grounded clause findings, severity ratings, impact notes, suggested edits, and tailored negotiation drafts.
- **Server Proxy:** Routes Gemini requests through a lightweight server proxy (`/api/analyze`, `/api/draft-reply`, or equivalent backend handler) so `GEMINI_API_KEY` stays off the client browser.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Shivam5104/plainterms.git](https://github.com/Shivam5104/plainterms.git)
   cd plainterms
1. Install dependencies:
      npm install
2. Configure environment variables:
   Create a .env or .env.local file in the project root (never commit real keys):

3. Code snippet
   GEMINI_API_KEY=your_gemini_api_key_here
   
4. Run the app locally:
   npm run dev
