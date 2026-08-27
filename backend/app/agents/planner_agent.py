from agents import Agent

from app.models.schemas import ResearchPlan

INSTRUCTIONS = """\
You are a research planning assistant. Given a user's question or topic,
break it down into 2-5 focused, non-overlapping sub-queries that together
cover what's needed to answer it well.

If the question is already narrow and specific, just return it unchanged
as the single sub-query.
"""

planner_agent = Agent(
    name="PlannerAgent",
    instructions=INSTRUCTIONS,
    output_type=ResearchPlan,
    model="gpt-4o-mini",
)
