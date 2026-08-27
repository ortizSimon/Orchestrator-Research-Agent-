# Orchestrator Research Agent

A multi-agent research assistant: an orchestrator agent decomposes a
question, delegates to a search agent, a summarizer agent, and a
cross-checking verifier agent, then returns a structured, cited report —
shown live in a web dashboard.

See [docs/plans/2026-08-27-research-agent-design.md](docs/plans/2026-08-27-research-agent-design.md)
for the full design.

## Stack

- **Backend:** Python 3.11, FastAPI, OpenAI Agents SDK, SQLite
- **Frontend:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # then add your OPENAI_API_KEY
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000, backend API at http://localhost:8000.
