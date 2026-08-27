from agents import Agent

from app.agents.search_agent import search_agent
from app.agents.summarizer_agent import summarizer_agent
from app.agents.verifier_agent import verifier_agent
from app.models.schemas import ResearchReport

INSTRUCTIONS = """\
You are a research orchestrator. Given a user's question or topic, produce
a well-sourced, verified research report by following this process:

1. Break the question down into 2-5 focused sub-queries that together cover
   the topic (skip this step and use the question as-is if it is already
   narrow).
2. For each sub_query, call the `search_web` tool to gather sources.
3. For each sub_query's search results, call the `summarize_sources` tool to
   extract sourced claims from them.
4. Once you have summaries for all sub-queries, call the `verify_claims`
   tool ONCE with all the sub-topic summaries together, so it can cross-
   check claims against each other.
5. If verification reveals a sub-topic with little or no supporting
   evidence, you may call `search_web` again with a refined sub_query to
   fill the gap, then re-summarize and re-verify.
6. Produce the final ResearchReport:
   - `executive_summary`: 2-4 sentences directly answering the original
     question.
   - `sections`: one ReportSection per sub-topic, heading = a short label
     for the sub-topic, claims = that sub-topic's verified claims.
   - `sources`: the deduplicated list of all SearchResult objects used
     across every sub-query.

Never fabricate a claim, source, or URL that didn't come from a tool call.
"""

orchestrator_agent = Agent(
    name="OrchestratorAgent",
    instructions=INSTRUCTIONS,
    tools=[
        search_agent.as_tool(
            tool_name="search_web",
            tool_description=(
                "Search the web for one focused sub-query. Returns a list of "
                "sources (title, url, snippet, published_date)."
            ),
        ),
        summarizer_agent.as_tool(
            tool_name="summarize_sources",
            tool_description=(
                "Given a sub_query and its search results, extract sourced "
                "factual claims from them."
            ),
        ),
        verifier_agent.as_tool(
            tool_name="verify_claims",
            tool_description=(
                "Given all sub-topic summaries, cross-check claims across "
                "sources and return confidence-scored, verified claims per "
                "sub-topic."
            ),
        ),
    ],
    output_type=ResearchReport,
    model="gpt-4o",
)
