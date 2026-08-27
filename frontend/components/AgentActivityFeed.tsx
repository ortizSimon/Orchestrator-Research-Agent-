"use client";

import { ActivityEvent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

function describeEvent(e: ActivityEvent): string {
  switch (e.event) {
    case "started":
      return `Starting research on "${e.question}"`;
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
  return (
    <ScrollArea className="h-72 rounded-md border bg-muted/30 p-4">
      <ul className="space-y-2 text-sm">
        {activity.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
            <span>{describeEvent(e)}</span>
          </li>
        ))}
        {isRunning && (
          <li className="flex items-center gap-2 font-medium text-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span>Working...</span>
          </li>
        )}
      </ul>
    </ScrollArea>
  );
}
