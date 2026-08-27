"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { ReportView } from "@/components/ReportView";
import { useResearchStream } from "@/lib/useResearchStream";

export default function Home() {
  const [question, setQuestion] = useState("");
  const { status, activity, report, runId, error, start } = useResearchStream();

  const isRunning = status === "running";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isRunning) return;
    start(question.trim());
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ask a research question
        </h1>
        <p className="text-sm text-muted-foreground">
          An orchestrator agent will search the web, summarize sources, and
          cross-check claims before giving you a cited report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What are the latest developments in fusion energy?"
          rows={3}
          disabled={isRunning}
        />
        <Button type="submit" disabled={isRunning || !question.trim()}>
          {isRunning ? "Researching..." : "Start research"}
        </Button>
      </form>

      {error && (
        <p className="rounded-md border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {(isRunning || activity.length > 0) && (
        <AgentActivityFeed activity={activity} isRunning={isRunning} />
      )}

      {report && <ReportView report={report} runId={runId} />}
    </div>
  );
}
