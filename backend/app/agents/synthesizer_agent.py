from agents import Agent

INSTRUCTIONS = """\
You will be given a JSON object with the original research "question" and
"verified_topics": a list of sub-topics, each with claims that have already
been fact-checked and confidence-scored.

Write a concise 2-4 sentence executive summary that directly answers the
question, based only on the given claims. Prefer higher-confidence claims.
Do not introduce any fact, source, or number that isn't in the given data.
Return plain text only, no markdown, no citations (those are shown
separately in the report).
"""

synthesizer_agent = Agent(
    name="SynthesizerAgent",
    instructions=INSTRUCTIONS,
    model="gpt-4o-mini",
)
