import { OrbState } from "@/components/Orb";
import { ActivityEvent } from "@/lib/types";

const TOOL_TO_STATE: Record<string, OrbState> = {
  search_web: "search",
  summarize_sources: "summarize",
  verify_claims: "verify",
  write_summary: "synthesize",
};

export function toolOrbState(tool?: string): OrbState {
  if (!tool) return "idle";
  return TOOL_TO_STATE[tool] ?? "idle";
}

/** Which stage is actively running right now, based on the running tally
 * of started/finished events (a stage can have several started-but-not-
 * finished calls in flight at once, e.g. parallel searches). */
export function currentOrbState(activity: ActivityEvent[]): OrbState {
  const inFlight = new Map<string, number>();
  let lastActiveTool: string | null = null;

  for (const e of activity) {
    if (e.event === "tool_started" && e.tool) {
      inFlight.set(e.tool, (inFlight.get(e.tool) ?? 0) + 1);
      lastActiveTool = e.tool;
    } else if (e.event === "tool_finished" && e.tool) {
      const count = (inFlight.get(e.tool) ?? 1) - 1;
      inFlight.set(e.tool, Math.max(count, 0));
    }
  }

  for (const [tool, count] of inFlight) {
    if (count > 0) return TOOL_TO_STATE[tool] ?? "idle";
  }
  return lastActiveTool ? (TOOL_TO_STATE[lastActiveTool] ?? "idle") : "idle";
}
