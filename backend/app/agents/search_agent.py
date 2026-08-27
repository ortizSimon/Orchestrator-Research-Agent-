from agents import Agent, WebSearchTool

from app.models.schemas import SearchResults

INSTRUCTIONS = """\
You are a web research assistant. You will be given a single sub-query.

1. Use the web_search tool to find relevant, credible, and (where possible)
   recent sources on the sub-query.
2. Return between 3 and 8 of the most relevant results.
3. For each result, extract the title, the exact source URL, a short
   snippet capturing the relevant fact(s), and the published date if it is
   available (otherwise leave it null). Never invent a URL or date.
"""

search_agent = Agent(
    name="SearchAgent",
    instructions=INSTRUCTIONS,
    tools=[WebSearchTool()],
    output_type=SearchResults,
    model="gpt-4o-mini",
)
