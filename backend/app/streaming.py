"""Adapts the pipeline's progress events for SSE: serializes the final
ResearchReport to plain JSON so it can be sent over the wire.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from app.pipeline import run_research


async def stream_research(question: str) -> AsyncIterator[dict]:
    async for event in run_research(question):
        if event["event"] == "report":
            yield {"event": "report", "report": event["report"].model_dump(mode="json")}
        else:
            yield event
