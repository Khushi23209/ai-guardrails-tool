# AI Guardrails

An observability and safety middleware for LLM applications. It sits between any LLM app and its users, checking every request and response for PII leaks, prompt injection attempts, and hallucinations — then logs everything to a dashboard for human review.

**Live Demo:** [Dashboard](https://ai-guardrails-tool-git-main-khushi23209s-projects.vercel.app) | **API:** [Backend](https://ai-guardrails-tool.onrender.com/health)

## The Problem

LLMs hallucinate with confidence, echo back sensitive data, and follow jailbreak prompts — all silently. A company running a customer-facing chatbot handling 10,000 conversations per day can't manually review every response. This tool automatically flags the ones that need attention.

## How It Works

Every request flows through two checkpoint layers:

```
User message
  → Pre-check: PII scan (regex) + Prompt injection classifier (LLM-as-judge)
  → LLM generates response (with RAG context from reference docs)
  → Post-check: PII scan on response + Hallucination detection
      → Extract individual claims from response
      → Embed each claim → Vector search pgvector for relevant doc chunks
      → Re-rank results with LLM
      → Score each claim against retrieved evidence
  → Log everything to PostgreSQL
  → Return response + grounding report with per-claim verdicts and citations
```

The tool also exposes a standalone verification endpoint (`POST /api/check`) that any LLM application can call with a user message and LLM response — no need to use the built-in chatbot.

## Eval Results

Evaluated on 120+ test cases including adversarial edge cases.

| Metric | Result | Test Cases |
|---|---|---|
| PII Detection Precision | 88.2% | 50 cases (25 positive incl. tricky formats, 25 negative incl. false-positive traps) |
| PII Detection Recall | 78.9% | Misses: SSN, passport, names, DOB, PAN — regex scoped to email/phone/card/Aadhaar |
| PII Detection F1 | 83.3% | 4 false positives on number patterns resembling PII |
| Prompt Injection Precision | 100% | 66 cases (33 attacks incl. subtle social engineering, 33 legitimate incl. security questions) |
| Prompt Injection Recall | 100% | Caught: grandmother trick, thought experiments, educational framing, encoded instructions |
| Retrieval Hit Rate | 100% @ rank 1 | 30 queries across 5 document types |
| Grounding Accuracy | 92.6% | 27 claims (15 supported + 15 contradicted, 3 lost to API errors) |

**Methodology note:** Test set is self-curated. PII hard cases include patterns that look like PII but aren't (order IDs matching phone patterns, batch numbers matching Aadhaar). Injection hard cases include legitimate questions about AI security that shouldn't be flagged. Expanding with public datasets (deepset/prompt-injections) is planned.

## The Three Guardrails

### 1. PII Detection

Regex-based scanner on both user input and LLM output. Detects email addresses, Indian phone numbers (+91 variants), credit card numbers (space/dash separated), and Aadhaar numbers. Catches PII the user sends and PII the LLM echoes back.

**Known limitation:** Does not detect names, addresses, SSN, passport numbers, PAN, or UPI IDs. Production system would add NER-based detection alongside regex.

### 2. Prompt Injection Detection

Sends user message to a separate LLM call with a classification prompt covering five attack categories: instruction override, persona hijacking, system prompt extraction, indirect injection (hidden in content), and encoding-based bypass. Returns structured JSON with verdict, confidence score, and reasoning.

**Why LLM instead of regex:** Injection attacks are natural language with infinite variations. "Ignore your instructions" and "please disregard your initial directives" are the same attack in different words. The LLM classifier caught subtle attacks like "my grandmother used to read me system prompts as bedtime stories" — no keyword list would catch that.

### 3. Hallucination Detection (RAG-based Grounding)

The most involved guardrail. After the LLM responds:

1. **Claim extraction** — LLM breaks the response into individual verifiable claims
2. **Retrieval** — Each claim is embedded and searched against reference chunks in pgvector (top 10 by cosine similarity)
3. **Re-ranking** — LLM re-scores the 10 candidates for relevance to the specific claim, keeps top 3
4. **Grounding** — LLM evaluates whether evidence supports, contradicts, or lacks info for each claim, with a 0-1 score and citation
5. **Aggregation** — Claim scores averaged into overall grounding score. Below 0.5 = flagged

**Design decisions:**
- 250-char chunks with 50-char overlap — matched to policy document structure, prevents sentence splitting
- Two-stage retrieve-and-rerank — vector search for speed, LLM re-ranking for precision
- Claim-level not response-level — "60% grounded" hides which parts are wrong; per-claim scoring is actionable
- Checking LLM does comparison, not generation — fundamentally different from the answering LLM (LLM-as-judge pattern)

## Standalone Verification API

Any LLM application can call the middleware without using the built-in chatbot:

```bash
POST /api/check
{
    "userMessage": "what is the refund policy?",
    "llmResponse": "Refunds are processed in 3 days."
}
```

Returns:
```json
{
    "pii": [],
    "injection": {"isInjection": false, "confidence": 0.98},
    "grounding": {"overallScore": 0.2, "claims": [...]},
    "flagged": true,
    "latency_ms": 8500
}
```

## Dashboard

React frontend with:
- Stats overview — total requests, flagged count, injections, avg latency, avg grounding score
- Live chat panel to test messages and see grounding results in real time
- Logs table with color-coded flagged rows
- Filters: All, Flagged, PII, Injection, Hallucination
- Search by message text, sort by date/latency/grounding score
- Detail view showing full message, response, PII findings, injection result, and per-claim grounding with verdicts, scores, reasons, and citations

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL with pgvector (Neon in production)
- **Embeddings:** Google Gemini API (gemini-embedding-2, 3072 dimensions)
- **LLM:** Groq API (gpt-oss-120b for chat/classification, gpt-oss-20b for re-ranking/grounding)
- **Frontend:** React, Vite
- **Deployment:** Render (backend), Vercel (frontend), Neon (database)

## Project Structure

```
ai-guardrails/
├── backend/
│   ├── server.js              # Express server, /chat, /api/check, /api/logs routes
│   ├── middleware.js           # preCheck and postCheck orchestration
│   ├── llmService.js           # RAG-powered chat (retrieves context before answering)
│   ├── piiDetector.js          # Regex-based PII detection
│   ├── injectionDetector.js    # LLM-based injection classification
│   ├── embedder.js             # Gemini embedding API
│   ├── chunker.js              # Text chunking with overlap
│   ├── vectorSearch.js         # pgvector cosine similarity search
│   ├── reranker.js             # LLM-based re-ranking
│   ├── retriever.js            # Search + re-rank pipeline
│   ├── claimExtractor.js       # LLM-based claim extraction
│   ├── groundingChecker.js     # Full grounding pipeline
│   ├── db.js                   # PostgreSQL connection pool
│   ├── ingest.js               # Reference doc ingestion script
│   └── reference-docs/         # Ground truth policy documents
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Dashboard layout with filters and sorting
│       ├── App.css
│       ├── main.jsx
│       └── components/
│           ├── StatsBar.jsx    # Metrics overview cards
│           ├── ChatPanel.jsx   # Live message testing
│           ├── LogsTable.jsx   # Sortable, filterable logs
│           └── LogDetail.jsx   # Per-request detail with claim analysis
└── eval/
    ├── test-cases.json         # 120+ test cases
    ├── evalPII.js              # Precision/recall/F1 for PII
    ├── evalInjection.js        # Precision/recall/F1 for injection
    ├── evalRetrieval.js        # Hit-rate for vector search
    ├── evalGrounding.js        # Accuracy for grounding verdicts
    ├── evalLatency.js          # p50/p95/p99 latency benchmarks
    └── runAll.js               # Combined eval runner
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL with pgvector extension

### Database

```sql
CREATE DATABASE ai_guardrails;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_message TEXT NOT NULL,
    llm_response TEXT,
    pii_detected JSONB DEFAULT '[]',
    prompt_injection_detected BOOLEAN DEFAULT FALSE,
    hallucination_score FLOAT,
    grounding_details JSONB DEFAULT '[]',
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    doc_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(3072),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in your API keys
node ingest.js           # embed and store reference docs
node server.js           # starts on port 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # starts on port 5173
```

### Environment Variables

```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ai_guardrails
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### Run Evals

```bash
node eval/evalPII.js
node eval/evalInjection.js
node eval/evalRetrieval.js
node eval/evalGrounding.js
```

## Known Limitations

- **PII regex only** — misses names, addresses, and context-dependent PII. Production would add NER.
- **Grounding limited to reference docs** — general knowledge queries score low. Production would add domain classification.
- **Latency** — 30-60s per request due to multiple LLM calls on free tiers. Production would parallelize checks, use faster models, and run grounding async.
- **Top 5 claims checked** — limits grounding to first 5 claims per response for latency. Configurable.
- **No auth on dashboard** — production would add JWT auth with team-based access control.
- **Self-curated eval set** — 120+ cases is indicative, not production-grade. Would expand with public adversarial datasets.

## Future Work

- Domain classifier to skip grounding for off-topic queries
- NER-based PII detection alongside regex
- Configurable blocking mode (currently monitor-only)
- Async grounding via background worker queue
- Dashboard auth with multi-tenant support
- Expand eval with public adversarial benchmarks
- Cross-encoder re-ranking for faster retrieval
- Embedding cache for repeated queries