"""Adapts the pipeline's progress events for SSE: serializes the final
ResearchReport to plain JSON, and turns any pipeline exception (API
errors, rate limits, timeouts, malformed model output) into an "error"
event instead of letting it kill the connection silently.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from agents.exceptions import AgentsException

from app.pipeline import run_research

logger = logging.getLogger(__name__)


async def stream_research(question: str) -> AsyncIterator[dict]:
    try:
        async for event in run_research(question):
            if event["event"] == "report":
                yield {"event": "report", "report": event["report"].model_dump(mode="json")}
            else:
                yield event
    except AgentsException as exc:
        logger.warning("Research pipeline failed for %r: %s", question, exc)
        yield {
            "event": "error",
            "message": "The research agent hit a problem (e.g. rate limit or "
            "malformed response) and couldn't finish. Please try again.",
        }
    except Exception:
        logger.exception("Unexpected error running research pipeline for %r", question)
        yield {
            "event": "error",
            "message": "Something went wrong while researching. Please try again.",
        }
