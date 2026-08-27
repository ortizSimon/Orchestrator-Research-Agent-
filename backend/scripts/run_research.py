"""Run the full search -> summarize -> verify -> synthesize pipeline for a
single question and print/save the resulting Markdown report.

Usage:
    uv run python scripts/run_research.py "What are the latest developments in fusion energy?"
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

from app.pipeline import run_research
from app.report_format import report_to_markdown


async def main(question: str) -> None:
    async for event in run_research(question):
        if event["event"] == "report":
            report = event["report"]
            break
        print(f"[{event['event']}] {event.get('label', event.get('question', ''))}"
              + (f": {event['input']}" if event.get("input") else ""))

    markdown = report_to_markdown(report)

    out_dir = Path(__file__).resolve().parent.parent / "output"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "last_report.md"
    out_path.write_text(markdown, encoding="utf-8")

    print("\n" + markdown)
    print(f"\n\n[saved to {out_path}]")


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What are the latest developments in fusion energy?"
    asyncio.run(main(question))
