"""Turns an Agents SDK streamed run into a sequence of small JSON-able
progress events the frontend can render as a live activity feed, then a
final event carrying the structured ResearchReport.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from agents import Runner
from agents.stream_events import AgentUpdatedStreamEvent, RunItemStreamEvent

from app.agents.orchestrator import orchestrator_agent
from app.models.schemas import ResearchReport

TOOL_LABELS = {
    "search_web": "Searching the web",
    "summarize_sources": "Summarizing sources",
    "verify_claims": "Cross-checking claims",
}


def _tool_input_preview(raw_item: Any) -> str | None:
    arguments = getattr(raw_item, "arguments", None)
    if isinstance(raw_item, dict):
        arguments = raw_item.get("arguments")
    if not arguments:
        return None
    try:
        parsed = json.loads(arguments)
    except (TypeError, ValueError):
        return None
    text = parsed.get("input") if isinstance(parsed, dict) else None
    if not text:
        return None
    return text if len(text) <= 160 else text[:157] + "..."


async def stream_research(question: str) -> AsyncIterator[dict]:
    """Yields progress events, then a final {"event": "report", ...} event."""
    call_id_to_tool: dict[str, str] = {}

    yield {"event": "started", "question": question}

    result = Runner.run_streamed(orchestrator_agent, question, max_turns=20)

    try:
        async for event in result.stream_events():
            if isinstance(event, AgentUpdatedStreamEvent):
                yield {"event": "agent_updated", "agent": event.new_agent.name}
                continue

            if not isinstance(event, RunItemStreamEvent):
                continue

            if event.name == "tool_called":
                tool_name = getattr(event.item, "tool_name", None) or "tool"
                call_id = getattr(event.item, "call_id", None)
                if call_id:
                    call_id_to_tool[call_id] = tool_name
                yield {
                    "event": "tool_started",
                    "tool": tool_name,
                    "label": TOOL_LABELS.get(tool_name, tool_name),
                    "input": _tool_input_preview(event.item.raw_item),
                }
            elif event.name == "tool_output":
                call_id = getattr(event.item, "call_id", None)
                tool_name = call_id_to_tool.get(call_id, "tool") if call_id else "tool"
                yield {
                    "event": "tool_finished",
                    "tool": tool_name,
                    "label": TOOL_LABELS.get(tool_name, tool_name),
                }
    except Exception as exc:  # surfaced to the frontend, not silently swallowed
        yield {"event": "error", "message": str(exc)}
        return

    report: ResearchReport = result.final_output
    yield {"event": "report", "report": report.model_dump(mode="json")}
