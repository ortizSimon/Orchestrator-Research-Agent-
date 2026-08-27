import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sse_starlette.sse import EventSourceResponse

from app import db
from app.models.schemas import ResearchReport
from app.report_format import report_to_markdown
from app.streaming import stream_research

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Research Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/research/stream")
async def research_stream(question: str) -> EventSourceResponse:
    question = question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question must not be empty")

    async def event_generator():
        run_id = uuid.uuid4().hex
        async for event in stream_research(question):
            if event["event"] == "report":
                report = ResearchReport.model_validate(event["report"])
                try:
                    db.save_run(
                        run_id=run_id,
                        question=question,
                        report=report,
                        created_at=datetime.now(timezone.utc).isoformat(),
                    )
                    event = {**event, "run_id": run_id}
                except Exception:
                    logger.exception("Failed to persist research run %s", run_id)
            yield {"event": event["event"], "data": json.dumps(event)}

    return EventSourceResponse(event_generator())


@app.get("/api/research/history")
async def history() -> list[dict]:
    return db.list_runs()


@app.get("/api/research/{run_id}")
async def get_run(run_id: str) -> dict:
    run = db.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "id": run["id"],
        "question": run["question"],
        "created_at": run["created_at"],
        "report": run["report"].model_dump(mode="json"),
    }


@app.get("/api/research/{run_id}/markdown")
async def get_run_markdown(run_id: str) -> PlainTextResponse:
    run = db.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return PlainTextResponse(report_to_markdown(run["report"]), media_type="text/markdown")
