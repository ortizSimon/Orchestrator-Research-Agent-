"""M1: run the full orchestrator -> search -> summarize -> verify pipeline
for a single question and print/save the resulting Markdown report.

Usage:
    uv run python scripts/run_research.py "What are the latest developments in fusion energy?"
"""

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from agents import Runner

from app.agents.orchestrator import orchestrator_agent
from app.report_format import report_to_markdown


async def main(question: str) -> None:
    result = await Runner.run(orchestrator_agent, question, max_turns=20)
    report = result.final_output  # ResearchReport (structured output_type)

    markdown = report_to_markdown(report)
    print(markdown)

    out_dir = Path(__file__).resolve().parent.parent / "output"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "last_report.md"
    out_path.write_text(markdown, encoding="utf-8")
    print(f"\n\n[saved to {out_path}]")


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What are the latest developments in fusion energy?"
    asyncio.run(main(question))
