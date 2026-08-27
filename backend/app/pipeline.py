"""Deterministic research pipeline.

Each stage calls a specialized agent directly via `Runner.run` and passes
the previous stage's *structured* output (serialized as JSON) into the
next. No LLM ever has to retype a citation from memory to relay it to
another tool call — that relay step is exactly what caused fabricated
URLs when this used an LLM-driven orchestrator calling agents as tools.

The only LLM judgment calls left are: splitting the question into
sub-queries (PlannerAgent) and writing the executive summary from already-
verified claims (SynthesizerAgent). Everything citation-bearing (claims,
confidence, sources) flows through as plain Python data.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from agents import Runner

from app.agents.planner_agent import planner_agent
from app.agents.search_agent import search_agent
from app.agents.summarizer_agent import summarizer_agent
from app.agents.synthesizer_agent import synthesizer_agent
from app.agents.verifier_agent import verifier_agent
from app.models.schemas import (
    ReportSection,
    ResearchReport,
    SearchResult,
    SearchResults,
    SubTopicSummary,
    VerificationResult,
)

TOOL_LABELS = {
    "search_web": "Searching the web",
    "summarize_sources": "Summarizing sources",
    "verify_claims": "Cross-checking claims",
    "write_summary": "Writing executive summary",
}


async def run_research(question: str) -> AsyncIterator[dict]:
    yield {"event": "started", "question": question}

    plan = (await Runner.run(planner_agent, question)).final_output
    sub_queries = plan.sub_queries or [question]

    async def search_one(sub_query: str) -> SearchResults:
        result = await Runner.run(search_agent, sub_query)
        return result.final_output

    for sq in sub_queries:
        yield _event("tool_started", "search_web", sq)
    search_results: list[SearchResults] = await asyncio.gather(
        *[search_one(sq) for sq in sub_queries]
    )
    for sq in sub_queries:
        yield _event("tool_finished", "search_web", sq)

    async def summarize_one(sr: SearchResults) -> SubTopicSummary:
        result = await Runner.run(summarizer_agent, sr.model_dump_json())
        return result.final_output

    for sr in search_results:
        yield _event("tool_started", "summarize_sources", sr.sub_query)
    summaries: list[SubTopicSummary] = await asyncio.gather(
        *[summarize_one(sr) for sr in search_results]
    )
    for sr in search_results:
        yield _event("tool_finished", "summarize_sources", sr.sub_query)

    yield _event("tool_started", "verify_claims", None)
    verify_input = json.dumps([s.model_dump() for s in summaries])
    verification = (await Runner.run(verifier_agent, verify_input)).final_output
    _enforce_confidence_bands(verification)
    yield _event("tool_finished", "verify_claims", None)

    sections = [
        ReportSection(heading=topic.sub_query, claims=topic.claims)
        for topic in verification.topics
    ]

    all_sources: dict[str, SearchResult] = {}
    for sr in search_results:
        for source in sr.results:
            all_sources[source.url] = source

    yield _event("tool_started", "write_summary", None)
    synth_input = json.dumps(
        {
            "question": question,
            "verified_topics": [t.model_dump() for t in verification.topics],
        }
    )
    executive_summary = (await Runner.run(synthesizer_agent, synth_input)).final_output
    yield _event("tool_finished", "write_summary", None)

    report = ResearchReport(
        question=question,
        executive_summary=executive_summary,
        sections=sections,
        sources=list(all_sources.values()),
    )
    yield {"event": "report", "report": report}


def _enforce_confidence_bands(verification: VerificationResult) -> None:
    """A claim with fewer than 2 independent supporting sources can't be
    "high confidence" (>=0.8), regardless of what the verifier LLM said.
    Cheap to check deterministically, so we don't rely on prompt-following
    for it.
    """
    for topic in verification.topics:
        for claim in topic.claims:
            if len(set(claim.supporting_sources)) < 2 and claim.confidence >= 0.8:
                claim.confidence = 0.79
                note = "Confidence capped: only one supporting source."
                claim.note = f"{claim.note} {note}" if claim.note else note


def _event(name: str, tool: str, input_text: str | None) -> dict:
    return {
        "event": name,
        "tool": tool,
        "label": TOOL_LABELS[tool],
        "input": input_text,
    }
