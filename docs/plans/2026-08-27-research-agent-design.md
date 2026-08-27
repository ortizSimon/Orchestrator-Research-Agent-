# Research Agent — Design Doc

Date: 2026-08-27

## 1. Overview

An orchestrator-driven multi-agent research assistant. The user submits a
question or topic; the system decomposes it, searches the web, summarizes
sources, cross-checks claims for accuracy, and returns a structured report
with citations and confidence scoring — shown live in a web dashboard, not a
terminal.

## 2. Agent architecture

Pattern: **orchestrator-as-controller, workers exposed as tools**
(`agent.as_tool()` in the OpenAI Agents SDK), not handoffs. Handoffs fully
transfer control to another agent (suited to support/triage flows). Here the
orchestrator must stay in the loop across stages — e.g. re-searching if
verification finds a gap — so it calls workers and receives typed results
back rather than transferring the conversation.

| Agent | Responsibility | Tools |
|---|---|---|
| **Orchestrator** | Decomposes the question into sub-queries, calls Search → Summarizer → Verifier per sub-query, decides whether more searching is needed, assembles the final report | Search Agent, Summarizer Agent, Verifier Agent (as tools) |
| **Search Agent** | Given one sub-query, finds relevant sources | OpenAI hosted `web_search` |
| **Summarizer Agent** | Given raw results for one sub-topic, extracts key claims, each tagged with its source | — |
| **Verifier Agent** | Cross-checks claims that recur across multiple summaries, flags contradictions/unsupported claims, scores confidence (source agreement + domain-reputation/recency heuristic) | — |
| **Report step** | Not a separate agent — the orchestrator's final structured output: exec summary, per-topic sections, confidence/caveats, sources list | — |

All inter-agent data is typed via **Pydantic models**, not free text, so
citations and confidence scores survive the pipeline without drifting or
being re-hallucinated at the final synthesis step.

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
services, they're async function calls orchestrated by the Agents SDK
`Runner`. Parallel sub-queries run via `asyncio.gather`.

For the live dashboard, the backend runs the orchestrator in **streaming
mode** (the Agents SDK emits events: agent started, tool called, tool
result, message delta). FastAPI forwards these as **Server-Sent Events**
(SSE) to the Next.js frontend, which renders:

- a live "agent activity feed" (e.g. "Searching: *impact of X on Y*...",
  "Verifying 4 claims about Z...")
- report sections filling in incrementally as they complete, rather than
  waiting for the whole run to finish

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
        orchestrator.py
        search_agent.py
        summarizer_agent.py
        verifier_agent.py
      models/
        schemas.py            # Pydantic models above
      db.py                    # SQLite persistence
      streaming.py             # Agents SDK events -> SSE formatting
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
