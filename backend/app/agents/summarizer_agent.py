from agents import Agent

from app.models.schemas import SubTopicSummary

INSTRUCTIONS = """\
You are a research summarizer. You will be given a sub-query and a list of
search results (title, url, snippet, published_date) for that sub-query.

Extract the key factual claims relevant to the sub-query. For each claim:
- State it as a single, specific, checkable sentence.
- Attach the exact source_url it came from (copy it verbatim from the input,
  never invent or alter a URL).

Only include claims that are actually supported by the given snippets. Do
not add outside knowledge. If the results don't support any clear claim,
return an empty claims list.
"""

summarizer_agent = Agent(
    name="SummarizerAgent",
    instructions=INSTRUCTIONS,
    output_type=SubTopicSummary,
    model="gpt-4o-mini",
)
