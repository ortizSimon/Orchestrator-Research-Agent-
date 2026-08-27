# Research Agent — Design Doc

Date: 2026-08-27

## 1. Overview

An orchestrator-driven multi-agent research assistant. The user submits a
question or topic; the system decomposes it, searches the web, summarizes
sources, cross-checks claims for accuracy, and returns a structured report
with citations and confidence scoring — shown live in a web dashboard, not a
terminal.

## 2. Agent architecture

**Revised during implementation (2026-08-27).** The original plan was an
LLM orchestrator calling Search/Summarizer/Verifier as tools
(`agent.as_tool()`). In testing, this produced fabricated citations: the
orchestrator LLM had to *retype* each tool's structured output as freeform
text to hand it to the next tool, and it wasn't reliable at reproducing
URLs verbatim across that relay — it filled in plausible-looking URLs that
didn't match any real source. That's a correctness failure a "verified,
cited" tool can't have.

**Current pattern: deterministic Python pipeline, specialized agents
called directly.** A plain async function (`app/pipeline.py`) calls each
agent in turn via `Runner.run(...)` and passes the *actual structured
object* (serialized JSON) from one stage into the next — no LLM ever
retypes a citation to relay it. LLM judgment is used only where it doesn't
touch citation fidelity: splitting the question into sub-queries, and
writing the executive summary from already-verified claims.

| Agent | Responsibility |
|---|---|
| **Planner** | Splits the question into 2-5 focused sub-queries |
| **Search Agent** | Given one sub-query, finds relevant sources (OpenAI hosted `web_search`) |
| **Summarizer Agent** | Given one sub-query's raw search results (as JSON), extracts key claims, each tagged with its source URL |
| **Verifier Agent** | Given all sub-topic summaries (as JSON), cross-checks recurring claims, flags contradictions, scores confidence |
| **Synthesizer** | Given the verified claims (as JSON), writes the 2-4 sentence executive summary |
| **Report assembly** | Plain Python, not an LLM call — builds `ReportSection`s and the deduplicated source list directly from the typed data |

A confidence band is also enforced in code, not just prompted: a claim with
fewer than 2 independent supporting sources is capped below 0.8 ("high
confidence") regardless of what the verifier LLM assigns, since that's a
cheap, deterministic check that shouldn't depend on prompt-following.

All inter-agent data is typed via **Pydantic models**, not free text, so
citations and confidence scores survive the pipeline without drifting or
being re-hallucinated at any step.

Core schemas:

```python
class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: str | None

class SourcedClaim(BaseModel):
    text: str
    source_url: str

class SubTopicSummary(BaseModel):
    sub_query: str
    claims: list[SourcedClaim]

class VerifiedClaim(BaseModel):
    text: str
    supporting_sources: list[str]
    contradicting_sources: list[str]
    confidence: float  # 0-1
    note: str | None   # e.g. "only one source, unverified"

class ResearchReport(BaseModel):
    question: str
    executive_summary: str
    sections: list[dict]  # topic heading -> verified claims
    sources: list[SearchResult]
    generated_at: datetime
```

## 3. Communication & streaming

Everything runs in a single Python process — sub-agents are not separate
services, they're async function calls (`Runner.run`) chained by
`app/pipeline.py`. Parallel sub-queries run via `asyncio.gather`.

`run_research()` is itself an async generator: it `yield`s a small progress
event (`tool_started` / `tool_finished`, with a human-readable label and
the sub-query text) around each stage, and a final `report` event carrying
the assembled `ResearchReport`. FastAPI forwards these as-is over
**Server-Sent Events** (SSE) to the Next.js frontend, which renders them as
a live "agent activity feed" (e.g. "Searching the web: *impact of X on
Y*...", "Cross-checking claims..."), then swaps in the full structured
report once the final event arrives.

## 4. Tech stack

- **Backend:** Python 3.11+, FastAPI, `openai-agents` SDK, Pydantic,
  `uvicorn`, SQLite via `sqlite3`/SQLModel for history, `uv` for dependency
  management
- **Frontend:** Next.js (App Router) + TypeScript, Tailwind CSS,
  shadcn/ui components, native `EventSource` for SSE consumption
- **Search:** OpenAI's built-in hosted `web_search` tool (no extra API key)
- **Persistence:** SQLite file, one row per research run (question, report
  JSON, created_at)

## 5. Folder structure

```
research-agent/
  backend/
    app/
      main.py                # FastAPI app, SSE endpoint
      agents/
        planner_agent.py
        search_agent.py
        summarizer_agent.py
        verifier_agent.py
        synthesizer_agent.py
      models/
        schemas.py            # Pydantic models above
      pipeline.py              # deterministic pipeline (async generator)
      db.py                    # SQLite persistence
      streaming.py             # serializes pipeline events for SSE
      report_format.py         # ResearchReport -> Markdown
    tests/
    pyproject.toml
    .env                       # OPENAI_API_KEY
  frontend/
    app/
      page.tsx                 # question input + live dashboard
      history/page.tsx         # past runs
      components/
        AgentActivityFeed.tsx
        ReportView.tsx
        SourceCard.tsx
        ConfidenceBadge.tsx
      lib/
        useResearchStream.ts    # SSE hook
    package.json
  docs/
    plans/
  README.md
```

## 6. Milestones

- **M0 — Scaffolding:** repo init, FastAPI hello-world, Next.js hello-world,
  env config, one "echo" agent round-trip to confirm the Agents SDK works.
- **M1 — Core pipeline (script, no UI):** Orchestrator + Search +
  Summarizer + Verifier working end-to-end, producing a Markdown report
  for a test question.
- **M2 — Structured outputs + persistence:** Pydantic schemas enforced
  through the whole pipeline; SQLite storage; REST endpoints (submit
  question, get report, list history).
- **M3 — Streaming + live dashboard:** SSE wired from Agents SDK run →
  FastAPI → Next.js; live activity feed component.
- **M4 — Report UI polish:** final report rendering (sections, citations,
  confidence badges), Markdown export button, history page.
- **M5 — Verification depth:** domain-reputation heuristics, recency
  weighting, contradictions clearly surfaced in the UI.
- **M6 — Polish:** error handling (search failures, rate limits, timeouts),
  loading/empty states, responsive layout, README + demo GIF/screenshots
  for the portfolio.

## 7. Decisions locked in

- Orchestration: OpenAI Agents SDK (Python)
- UI: live streaming dashboard (Next.js/TypeScript)
- Web search: OpenAI's built-in `web_search` tool
- Deployment: local only for now
- History: saved to SQLite
- Export: on-screen report + Markdown download
- Verification: cross-checking + credibility/recency scoring

## 8. Stretch goals (not in initial scope)

- Deploy live (Vercel frontend + Fly.io/Render backend) with rate-limiting
  to protect API credits from public use
- PDF export
- Auth if made public
