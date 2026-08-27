"use client";

import { toolOrbState } from "@/lib/agentState";
import { ActivityEvent } from "@/lib/types";

function describeEvent(e: ActivityEvent): string {
  switch (e.event) {
    case "started":
      return `Reading the question`;
    case "agent_updated":
      return `${e.agent} is taking over`;
    case "tool_started":
      return e.input ? `${e.label}: "${e.input}"` : `${e.label}...`;
    case "tool_finished":
      return `${e.label} — done`;
    default:
      return e.event;
  }
}

export function AgentActivityFeed({
  activity,
  isRunning,
}: {
  activity: ActivityEvent[];
  isRunning: boolean;
}) {
  const visible = activity.filter((e) => e.event !== "tool_finished");

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <ul className="flex flex-col gap-3.5">
        {visible.map((e, i) => {
          const state = e.event === "tool_started" ? toolOrbState(e.tool) : "idle";
          const color = state === "idle" ? "rgba(243,241,236,0.4)" : `var(--agent-${state})`;
          return (
            <li
              key={i}
              className="flex animate-feed-in items-start gap-3 text-sm"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)` }}
              />
              <span className="text-muted-foreground/90">{describeEvent(e)}</span>
            </li>
          );
        })}
        {isRunning && (
          <li className="flex items-center gap-3 text-sm font-medium text-foreground">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
            <span>Working&hellip;</span>
          </li>
        )}
      </ul>
    </div>
  );
}
