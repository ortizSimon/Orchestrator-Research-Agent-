from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.models.schemas import ResearchReport

DB_PATH = Path(__file__).resolve().parent.parent / "research_agent.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS research_runs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(SCHEMA)
        conn.commit()


def save_run(run_id: str, question: str, report: ResearchReport, created_at: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO research_runs (id, question, report_json, created_at) VALUES (?, ?, ?, ?)",
            (run_id, question, report.model_dump_json(), created_at),
        )
        conn.commit()


def get_run(run_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, question, report_json, created_at FROM research_runs WHERE id = ?",
            (run_id,),
        ).fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "question": row["question"],
            "report": ResearchReport.model_validate_json(row["report_json"]),
            "created_at": row["created_at"],
        }


def list_runs() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, question, created_at FROM research_runs ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]
