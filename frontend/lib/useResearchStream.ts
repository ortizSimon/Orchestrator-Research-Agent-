"use client";

import { useCallback, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { ActivityEvent, ResearchReportT } from "@/lib/types";

export type ResearchStatus = "idle" | "running" | "done" | "error";

export function useResearchStream() {
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [report, setReport] = useState<ResearchReportT | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const start = useCallback((question: string) => {
    esRef.current?.close();
    setStatus("running");
    setActivity([]);
    setReport(null);
    setError(null);
    setRunId(null);

    const url = `${API_BASE}/api/research/stream?question=${encodeURIComponent(question)}`;
    const es = new EventSource(url);
    esRef.current = es;

    const handle = (raw: MessageEvent) => {
      const data = JSON.parse(raw.data) as ActivityEvent;
      if (data.event === "report" && data.report) {
        setReport(data.report);
        setRunId(data.run_id ?? null);
        setStatus("done");
        es.close();
        return;
      }
      if (data.event === "error") {
        setError(data.message ?? "Something went wrong");
        setStatus("error");
        es.close();
        return;
      }
      setActivity((prev) => [...prev, data]);
    };

    (
      ["started", "agent_updated", "tool_started", "tool_finished", "report", "error"] as const
    ).forEach((evt) => es.addEventListener(evt, handle as EventListener));

    es.onerror = () => {
      setStatus((prev) => {
        if (prev === "done") return prev;
        setError("Lost connection to the research agent.");
        return "error";
      });
      es.close();
    };
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    setStatus("idle");
    setActivity([]);
    setReport(null);
    setRunId(null);
    setError(null);
  }, []);

  return { status, activity, report, runId, error, start, reset };
}
