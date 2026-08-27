"""M0 smoke test: confirms the OpenAI Agents SDK can run an agent end-to-end.

Run manually with: uv run python tests/test_echo_agent.py
Requires OPENAI_API_KEY to be set in backend/.env
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from agents import Agent, Runner


async def main() -> None:
    agent = Agent(
        name="EchoAgent",
        instructions="Reply with exactly one short sentence confirming you received the input.",
    )
    result = await Runner.run(agent, "Hello, are you working?")
    print("Agent output:", result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
